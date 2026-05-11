// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  Payroll.sol v3
 * @notice Individual payroll contract. Always deployed via PayrollFactory.
 *
 * CHANGES FROM v2
 * ────────────────
 * + factory address stored at construction (immutable)
 * + label stored at construction (immutable — cannot be changed)
 * + constructor signature updated: (payPeriod, firstPayDate, label, factory)
 * + _addRecipient notifies factory.registerEmployee() after adding
 * + transferOwnership called by factory immediately after deployment
 *
 * ALL v2 FIXES INTACT
 * ────────────────────
 * FIX 1 — Per-transfer isolation via try/catch. One failure skips, not reverts.
 * FIX 2 — Stale FX rate falls back to USDC. Payroll always runs.
 * FIX 3 — Withdraw gap closed. lastDisburseTime blocks rug-pull window.
 * FIX 4 — Funding visibility: isFunded(), fundingShortfall(), minimumBalanceRequired()
 * FIX 5 — addRecipientHuman() accepts whole USDC numbers. No decimal mistakes.
 *
 * ARC TESTNET
 * ────────────
 * USDC ERC20 : 0x3600000000000000000000000000000000000000 (6 decimals)
 * Chain ID   : 5042002
 * RPC        : https://rpc.testnet.arc.network
 * Explorer   : https://testnet.arcscan.app
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IPayrollFactory {
    function registerEmployee(address employee) external;
}

contract Payroll {

    // ─── CONSTANTS ────────────────────────────────────────────────────────────

    address public constant USDC         = 0x3600000000000000000000000000000000000000;
    uint256 public constant USDC_DECIMALS = 1e6;
    uint256 public constant MAX_RATE_AGE  = 26 hours;
    uint256 public constant MIN_PAY_PERIOD = 1 days;

    // ─── IMMUTABLES ───────────────────────────────────────────────────────────

    /// @dev Factory that deployed this contract. Set once, never changed.
    address public immutable factory;

    /// @dev Human-readable label set at creation. Immutable.
    ///      e.g. "Full-time Staff", "Contractors Q2 2026"
    string public label;

    // ─── STATE ────────────────────────────────────────────────────────────────

    address public owner;
    bool    public paused;

    uint256 public payPeriod;
    uint256 public nextPayDate;
    uint256 public lastDisburseTime;

    // Total lifetime stats
    uint256 public totalDisbursed;     // total USDC sent across all cycles
    uint256 public totalCyclesRun;     // number of times disburse() succeeded

    struct Recipient {
        address wallet;
        uint256 usdcAmount;      // 6 decimals. 100 USDC = 100_000_000
        string  currencyCode;    // "BRLA" | "MXNB" | "PHPC" | "USDC"
        bool    active;
        uint256 addedAt;         // timestamp when recipient was added
        uint256 totalReceived;   // lifetime USDC received by this recipient
    }

    struct FxRate {
        uint256 rate;       // local units per 1 USDC, scaled 1e2
                            // e.g. 1 USDC = 5.20 BRLA → rate = 520
        uint256 updatedAt;
        address updatedBy;
    }

    mapping(uint256 => Recipient) public recipients;
    uint256 public recipientCount;

    mapping(bytes32 => FxRate) public fxRates;

    // ─── EVENTS ───────────────────────────────────────────────────────────────

    event RecipientAdded(
        uint256 indexed id,
        address indexed wallet,
        uint256 usdcAmount,
        string  currencyCode,
        uint256 timestamp
    );
    event RecipientRemoved(uint256 indexed id, uint256 timestamp);

    event Deposited(
        address indexed from,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );

    event FxRateUpdated(
        string  currencyCode,
        uint256 rate,
        uint256 timestamp,
        address indexed updatedBy
    );

    event Disbursed(
        uint256 indexed recipientId,
        address indexed wallet,
        uint256 usdcAmount,
        string  currencyCode,
        uint256 localEquivalent,
        uint256 fxRate,
        bool    wasFallback,
        uint256 timestamp,
        address indexed triggeredBy
    );

    event DisbursementFailed(
        uint256 indexed recipientId,
        address indexed wallet,
        uint256 usdcAmount,
        string  reason,
        uint256 timestamp
    );

    event FallbackToUSDC(
        uint256 indexed recipientId,
        address indexed wallet,
        string  intendedCurrency,
        uint256 usdcAmount,
        uint256 timestamp
    );

    event PayCycleAdvanced(
        uint256 previousPayDate,
        uint256 nextPayDate,
        uint256 cycleNumber,
        address triggeredBy,
        uint256 timestamp
    );

    event Paused(address by, uint256 timestamp);
    event Unpaused(address by, uint256 timestamp);
    event Withdrawn(address by, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─── ERRORS ───────────────────────────────────────────────────────────────

    error NotOwner();
    error NotFactory();
    error ContractPaused();
    error PayDateNotReached(uint256 nextPayDate, uint256 currentTime);
    error InsufficientBalance(uint256 required, uint256 available);
    error NoActiveRecipients();
    error ZeroAmount();
    error InvalidWallet();
    error PayPeriodTooShort();
    error WithdrawWhilePending();
    error TransferFailed();
    error InvalidRecipientId();

    // ─── MODIFIERS ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────────

    /**
     * @param _payPeriodSeconds  Seconds between disbursements.
     * @param _firstPayDate      Unix timestamp of first disbursement.
     * @param _label             Immutable name for this payroll.
     * @param _factory           Address of the PayrollFactory that deployed this.
     *
     * @dev  Owner is set to msg.sender (the factory) at construction.
     *       Factory immediately calls transferOwnership(employer) after deployment.
     */
    constructor(
        uint256 _payPeriodSeconds,
        uint256 _firstPayDate,
        string memory _label,
        address _factory
    ) {
        if (_payPeriodSeconds < MIN_PAY_PERIOD) revert PayPeriodTooShort();
        if (_factory == address(0))             revert InvalidWallet();
        if (bytes(_label).length == 0)          revert ZeroAmount();

        owner            = msg.sender; // factory owns briefly, transfers next
        factory          = _factory;
        label            = _label;
        payPeriod        = _payPeriodSeconds;
        nextPayDate      = _firstPayDate;
        lastDisburseTime = 0;
    }

    // ─── EMPLOYER: DEPOSIT ────────────────────────────────────────────────────

    /**
     * @notice Deposit USDC into payroll escrow.
     * @dev    Must approve this contract address on USDC first.
     *         100 USDC = 100_000_000 (6 decimals).
     */
    function deposit(uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        bool ok = IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit Deposited(msg.sender, amount, IERC20(USDC).balanceOf(address(this)), block.timestamp);
    }

    // ─── EMPLOYER: RECIPIENTS ─────────────────────────────────────────────────

    /**
     * @notice Add a recipient using raw 6-decimal USDC amount.
     *         100 USDC = 100_000_000. For programmatic use.
     */
    function addRecipient(
        address wallet,
        uint256 usdcAmount,
        string calldata currencyCode
    ) external onlyOwner {
        if (wallet == address(0)) revert InvalidWallet();
        if (usdcAmount == 0)      revert ZeroAmount();
        _addRecipient(wallet, usdcAmount, currencyCode);
    }

    /**
     * @notice FIX 5 — Add a recipient using whole USDC numbers.
     *         Pass 100 for 100 USDC. No decimal conversion needed.
     *         addRecipientHuman(maria, 100, "BRLA") = 100 USDC salary.
     */
    function addRecipientHuman(
        address wallet,
        uint256 wholeUsdcAmount,
        string calldata currencyCode
    ) external onlyOwner {
        if (wallet == address(0)) revert InvalidWallet();
        if (wholeUsdcAmount == 0) revert ZeroAmount();
        _addRecipient(wallet, wholeUsdcAmount * USDC_DECIMALS, currencyCode);
    }

    /**
     * @dev Internal: stores recipient + notifies factory for employee lookup.
     */
    function _addRecipient(
        address wallet,
        uint256 usdcAmount,
        string memory currencyCode
    ) internal {
        uint256 id = recipientCount++;
        recipients[id] = Recipient({
            wallet:        wallet,
            usdcAmount:    usdcAmount,
            currencyCode:  currencyCode,
            active:        true,
            addedAt:       block.timestamp,
            totalReceived: 0
        });

        emit RecipientAdded(id, wallet, usdcAmount, currencyCode, block.timestamp);

        // Notify factory so employee can find this payroll by their wallet
        // Wrapped in try/catch — if factory call fails, don't block adding recipient
        try IPayrollFactory(factory).registerEmployee(wallet) {} catch {}
    }

    /**
     * @notice Deactivate a recipient. They stay in storage for history.
     *         They will NOT be removed from factory's employee lookup —
     *         frontend filters by active status.
     */
    function removeRecipient(uint256 id) external onlyOwner {
        if (id >= recipientCount) revert InvalidRecipientId();
        recipients[id].active = false;
        emit RecipientRemoved(id, block.timestamp);
    }

    // ─── EMPLOYER: WITHDRAW ───────────────────────────────────────────────────

    /**
     * @notice FIX 3 — Withdraw USDC.
     *         Blocked between nextPayDate arriving and disburse() being called.
     *         Prevents employer from draining contract on payday before employees
     *         receive their salaries.
     */
    function withdraw(uint256 amount) external onlyOwner {
        bool disbursedThisCycle = lastDisburseTime >= (nextPayDate - payPeriod);
        bool paydayPending      = block.timestamp >= nextPayDate;

        if (!paused && paydayPending && !disbursedThisCycle) {
            revert WithdrawWhilePending();
        }

        uint256 bal = IERC20(USDC).balanceOf(address(this));
        if (amount > bal) revert InsufficientBalance(amount, bal);

        bool ok = IERC20(USDC).transfer(owner, amount);
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    // ─── FX RATES ─────────────────────────────────────────────────────────────

    /**
     * @notice Update FX rate for a currency. Permissionless — anyone can call.
     *         Called automatically by the Vercel cron via the API route.
     *
     * @param  currencyCode  e.g. "BRLA", "MXNB", "PHPC"
     * @param  rate          Local units per 1 USDC, scaled by 1e2.
     *                       1 USDC = 5.20 BRLA  → rate = 520
     *                       1 USDC = 17.20 MXNB → rate = 1720
     *                       1 USDC = 56.40 PHPC → rate = 5640
     */
    function updateFxRate(string calldata currencyCode, uint256 rate) external {
        if (rate == 0) revert ZeroAmount();
        bytes32 key = keccak256(bytes(currencyCode));
        fxRates[key] = FxRate({
            rate:      rate,
            updatedAt: block.timestamp,
            updatedBy: msg.sender
        });
        emit FxRateUpdated(currencyCode, rate, block.timestamp, msg.sender);
    }

    function getFxRate(string calldata currencyCode)
        external view
        returns (uint256 rate, uint256 updatedAt, address updatedBy)
    {
        FxRate memory r = fxRates[keccak256(bytes(currencyCode))];
        return (r.rate, r.updatedAt, r.updatedBy);
    }

    // ─── CORE: DISBURSE ───────────────────────────────────────────────────────

    /**
     * @notice Disburse salaries to all active recipients.
     *         Permissionless — anyone can call once block.timestamp >= nextPayDate.
     *
     * FIX 1: Each transfer is isolated. Failure emits DisbursementFailed, continues.
     * FIX 2: Stale FX rate → USDC fallback. Emits FallbackToUSDC. Never blocks.
     * FIX 3: Sets lastDisburseTime to close the withdraw gap.
     * FIX 4: Checks funding upfront with clear error message.
     */
    function disburse() external whenNotPaused {

        // ── CHECKS ───────────────────────────────────────────────────────────

        if (block.timestamp < nextPayDate)
            revert PayDateNotReached(nextPayDate, block.timestamp);

        uint256 activeCount;
        uint256 totalRequired;

        for (uint256 i = 0; i < recipientCount; i++) {
            if (!recipients[i].active) continue;
            activeCount++;
            totalRequired += recipients[i].usdcAmount;
        }

        if (activeCount == 0) revert NoActiveRecipients();

        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance < totalRequired)
            revert InsufficientBalance(totalRequired, balance);

        // ── EFFECTS ──────────────────────────────────────────────────────────

        uint256 prevPayDate  = nextPayDate;
        nextPayDate          = nextPayDate + payPeriod;
        lastDisburseTime     = block.timestamp;
        totalCyclesRun      += 1;

        emit PayCycleAdvanced(
            prevPayDate,
            nextPayDate,
            totalCyclesRun,
            msg.sender,
            block.timestamp
        );

        // ── INTERACTIONS ─────────────────────────────────────────────────────

        for (uint256 i = 0; i < recipientCount; i++) {
            Recipient storage r = recipients[i];
            if (!r.active) continue;

            bool    wasFallback     = false;
            uint256 localEquivalent = 0;
            uint256 rateUsed        = 0;

            // FIX 2: Check FX rate freshness
            bytes32 rateKey  = keccak256(bytes(r.currencyCode));
            bool    isUSDC   = rateKey == keccak256(bytes("USDC"));
            FxRate  memory fx = fxRates[rateKey];

            bool rateIsStale = !isUSDC && (
                fx.updatedAt == 0 ||
                block.timestamp - fx.updatedAt > MAX_RATE_AGE
            );

            if (rateIsStale) {
                wasFallback     = true;
                localEquivalent = r.usdcAmount;
                rateUsed        = 0;
                emit FallbackToUSDC(i, r.wallet, r.currencyCode, r.usdcAmount, block.timestamp);
            } else if (!isUSDC && fx.rate > 0) {
                localEquivalent = (r.usdcAmount * fx.rate) / 1e8;
                rateUsed        = fx.rate;
            } else {
                localEquivalent = r.usdcAmount;
                rateUsed        = 0;
            }

            // FIX 1: Isolate each transfer
            bool transferOk;
            try this._safeTransfer(r.wallet, r.usdcAmount) {
                transferOk = true;
            } catch {
                transferOk = false;
            }

            if (transferOk) {
                // Update recipient lifetime stats
                r.totalReceived += r.usdcAmount;
                totalDisbursed  += r.usdcAmount;

                emit Disbursed({
                    recipientId:     i,
                    wallet:          r.wallet,
                    usdcAmount:      r.usdcAmount,
                    currencyCode:    r.currencyCode,
                    localEquivalent: localEquivalent,
                    fxRate:          rateUsed,
                    wasFallback:     wasFallback,
                    timestamp:       block.timestamp,
                    triggeredBy:     msg.sender
                });
            } else {
                emit DisbursementFailed({
                    recipientId: i,
                    wallet:      r.wallet,
                    usdcAmount:  r.usdcAmount,
                    reason:      "TRANSFER_FAILED",
                    timestamp:   block.timestamp
                });
            }
        }
    }

    /**
     * @dev External wrapper for try/catch isolation (FIX 1).
     *      Only callable by this contract itself.
     */
    function _safeTransfer(address to, uint256 amount) external {
        require(msg.sender == address(this), "Internal only");
        bool ok = IERC20(USDC).transfer(to, amount);
        require(ok, "ERC20 transfer failed");
    }

    // ─── ADMIN ────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender, block.timestamp);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Transfer ownership to a new employer wallet.
     *         Called by factory immediately after deployment.
     *         Can also be used by employer to transfer their payroll.
     */
    function transferOwnership(address newOwner) external {
        // Allow factory to call during initial setup, or owner afterwards
        if (msg.sender != owner && msg.sender != factory) revert NotOwner();
        if (newOwner == address(0)) revert InvalidWallet();
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    // ─── VIEWS ────────────────────────────────────────────────────────────────

    /// @notice True if disburse() can be called right now.
    function isPaydayReady() external view returns (bool) {
        return !paused && block.timestamp >= nextPayDate;
    }

    /// @notice FIX 4 — Total USDC needed for one full cycle.
    function minimumBalanceRequired() external view returns (uint256 total) {
        for (uint256 i = 0; i < recipientCount; i++) {
            if (recipients[i].active) total += recipients[i].usdcAmount;
        }
    }

    /// @notice FIX 4 — True if contract has enough USDC for next payday.
    function isFunded() external view returns (bool) {
        uint256 required;
        for (uint256 i = 0; i < recipientCount; i++) {
            if (recipients[i].active) required += recipients[i].usdcAmount;
        }
        return IERC20(USDC).balanceOf(address(this)) >= required;
    }

    /// @notice Current USDC balance held in escrow.
    function contractBalance() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    /// @notice Seconds until next pay date. 0 if payday is now or overdue.
    function secondsUntilPayday() external view returns (uint256) {
        if (block.timestamp >= nextPayDate) return 0;
        return nextPayDate - block.timestamp;
    }

    /// @notice FIX 4 — How much more USDC is needed. 0 if fully funded.
    function fundingShortfall() external view returns (uint256) {
        uint256 required;
        for (uint256 i = 0; i < recipientCount; i++) {
            if (recipients[i].active) required += recipients[i].usdcAmount;
        }
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        return balance >= required ? 0 : required - balance;
    }

    /**
     * @notice Returns all recipients (active and inactive) for display.
     *         Frontend filters by active field.
     */
    function getRecipients() external view returns (Recipient[] memory) {
        Recipient[] memory list = new Recipient[](recipientCount);
        for (uint256 i = 0; i < recipientCount; i++) {
            list[i] = recipients[i];
        }
        return list;
    }

    /**
     * @notice Full payroll summary in one call. Reduces frontend RPC calls.
     */
    function getSummary() external view returns (
        string  memory _label,
        address _owner,
        uint256 _payPeriod,
        uint256 _nextPayDate,
        uint256 _secondsUntilPayday,
        uint256 _balance,
        uint256 _required,
        uint256 _shortfall,
        bool    _isFunded,
        bool    _isPaydayReady,
        bool    _paused,
        uint256 _totalDisbursed,
        uint256 _totalCyclesRun,
        uint256 _recipientCount
    ) {
        uint256 required;
        uint256 active;
        for (uint256 i = 0; i < recipientCount; i++) {
            if (recipients[i].active) {
                required += recipients[i].usdcAmount;
                active++;
            }
        }
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        uint256 secs    = block.timestamp >= nextPayDate ? 0 : nextPayDate - block.timestamp;

        return (
            label,
            owner,
            payPeriod,
            nextPayDate,
            secs,
            balance,
            required,
            balance >= required ? 0 : required - balance,
            balance >= required,
            !paused && block.timestamp >= nextPayDate,
            paused,
            totalDisbursed,
            totalCyclesRun,
            active
        );
    }
}
