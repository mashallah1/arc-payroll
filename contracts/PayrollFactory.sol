// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Payroll-4.sol";

/**
 * @title  PayrollFactory.sol
 * @notice Entry point for the Arc Payroll protocol.
 *         Any wallet can create an independent Payroll contract.
 *         Tracks employer → payrolls, employee → payrolls, and all payrolls.
 *
 * ARCHITECTURE
 * ─────────────
 * 1. Employer calls createPayroll() → factory deploys Payroll.sol,
 *    transfers ownership to employer, records everything.
 *
 * 2. When employer adds a recipient to their Payroll, Payroll calls
 *    factory.registerEmployee() — factory maps employee → payroll.
 *    Only valid Payroll contracts (deployed by this factory) can call this.
 *
 * 3. Frontend reads:
 *    - getEmployerPayrolls(wallet) → show employer dashboard
 *    - getEmployeePayrolls(wallet) → show employee dashboard
 *    - getAllPayrolls()            → public view + cron FX updates
 *
 * ARC TESTNET
 * ────────────
 * Chain ID   : 5042002
 * RPC        : https://rpc.testnet.arc.network
 * Explorer   : https://testnet.arcscan.app
 * USDC ERC20 : 0x3600000000000000000000000000000000000000
 */

contract PayrollFactory {

    // ─── STATE ────────────────────────────────────────────────────────────────

    /// @dev All payroll contracts ever deployed by this factory.
    address[] public allPayrolls;

    /// @dev employer wallet → list of their payroll contract addresses.
    mapping(address => address[]) public employerPayrolls;

    /// @dev employee wallet → list of payroll contracts they appear in.
    mapping(address => address[]) public employeePayrolls;

    /// @dev Quick validation: is this address a payroll we deployed?
    mapping(address => bool) public isPayroll;

    /// @dev payroll address → employer who created it (for reverse lookup).
    mapping(address => address) public payrollEmployer;

    // ─── EVENTS ───────────────────────────────────────────────────────────────

    event PayrollCreated(
        address indexed employer,
        address indexed payroll,
        string  label,
        uint256 payPeriod,
        uint256 firstPayDate,
        uint256 timestamp
    );

    event EmployeeRegistered(
        address indexed employee,
        address indexed payroll,
        address indexed employer,
        uint256 timestamp
    );

    // ─── ERRORS ───────────────────────────────────────────────────────────────

    error NotAValidPayroll();
    error EmptyLabel();
    error ZeroPeriod();
    error ZeroPayDate();

    // ─── CREATE PAYROLL ───────────────────────────────────────────────────────

    /**
     * @notice Deploy a new Payroll contract owned by the caller.
     * @param  payPeriodSeconds  How often payroll runs. Min 1 day.
     * @param  firstPayDate      Unix timestamp of first disbursement.
     * @param  label             Human-readable name. Immutable after creation.
     *                           e.g. "Full-time Staff", "Contractors Q2 2026"
     * @return payrollAddress    Address of the newly deployed Payroll contract.
     */
    function createPayroll(
        uint256 payPeriodSeconds,
        uint256 firstPayDate,
        string calldata label
    ) external returns (address payrollAddress) {
        if (bytes(label).length == 0)  revert EmptyLabel();
        if (payPeriodSeconds == 0)     revert ZeroPeriod();
        if (firstPayDate == 0)         revert ZeroPayDate();

        // Deploy Payroll — factory address and label passed into constructor
        Payroll payroll = new Payroll(
            payPeriodSeconds,
            firstPayDate,
            label,
            address(this)   // factory address — Payroll reports back here
        );

        // Transfer ownership to the employer immediately
        payroll.transferOwnership(msg.sender);

        payrollAddress = address(payroll);

        // Record everything
        allPayrolls.push(payrollAddress);
        employerPayrolls[msg.sender].push(payrollAddress);
        isPayroll[payrollAddress]       = true;
        payrollEmployer[payrollAddress] = msg.sender;

        emit PayrollCreated(
            msg.sender,
            payrollAddress,
            label,
            payPeriodSeconds,
            firstPayDate,
            block.timestamp
        );
    }

    // ─── EMPLOYEE REGISTRATION ────────────────────────────────────────────────

    /**
     * @notice Called by a Payroll contract when a recipient is added.
     *         Only valid Payroll contracts deployed by this factory can call this.
     * @param  employee  The recipient wallet address being registered.
     */
    function registerEmployee(address employee) external {
        if (!isPayroll[msg.sender]) revert NotAValidPayroll();

        // Avoid duplicate registrations for the same payroll
        address[] storage existing = employeePayrolls[employee];
        for (uint256 i = 0; i < existing.length; i++) {
            if (existing[i] == msg.sender) return; // already registered
        }

        employeePayrolls[employee].push(msg.sender);

        emit EmployeeRegistered(
            employee,
            msg.sender,
            payrollEmployer[msg.sender],
            block.timestamp
        );
    }

    // ─── VIEWS ────────────────────────────────────────────────────────────────

    /**
     * @notice All payroll contracts created by a specific employer.
     */
    function getEmployerPayrolls(address employer)
        external view
        returns (address[] memory)
    {
        return employerPayrolls[employer];
    }

    /**
     * @notice All payroll contracts an employee appears in.
     *         Frontend uses this to auto-load employee dashboard on wallet connect.
     */
    function getEmployeePayrolls(address employee)
        external view
        returns (address[] memory)
    {
        return employeePayrolls[employee];
    }

    /**
     * @notice Every payroll ever deployed. Used by cron to update FX rates.
     */
    function getAllPayrolls()
        external view
        returns (address[] memory)
    {
        return allPayrolls;
    }

    /**
     * @notice Total number of payrolls deployed via this factory.
     */
    function totalPayrolls() external view returns (uint256) {
        return allPayrolls.length;
    }

    /**
     * @notice Validate a payroll address was deployed by this factory.
     */
    function isValidPayroll(address payroll) external view returns (bool) {
        return isPayroll[payroll];
    }
}
