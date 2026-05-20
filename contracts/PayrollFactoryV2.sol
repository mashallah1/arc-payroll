// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PayrollV2.sol";

contract PayrollFactoryV2 {

        // ─────────────────────────────────────────────
            // OWNER
                // ─────────────────────────────────────────────

                    address public owner;

                        modifier onlyOwner() {
                                    require(msg.sender == owner, "Not owner");
                                            _;
                        }

                            // ─────────────────────────────────────────────
                                // CONFIG
                                    // ─────────────────────────────────────────────

                                        address public settlementToken;

                                            uint256 public latestVersion;

                                                mapping(uint256 => address)
                                                        public implementations;

                                                            // ─────────────────────────────────────────────
                                                                // REGISTRY
                                                                    // ─────────────────────────────────────────────

                                                                        address[] public allPayrolls;

                                                                            mapping(address => address[])
                                                                                    public employerPayrolls;

                                                                                        mapping(address => address[])
                                                                                                public employeePayrolls;

                                                                                                    mapping(address => bool)
                                                                                                            public isPayroll;

                                                                                                                mapping(address => address)
                                                                                                                        public payrollEmployer;

                                                                                                                            mapping(address => uint256)
                                                                                                                                    public payrollVersion;

                                                                                                                                        mapping(address => uint256)
                                                                                                                                                public payrollChainId;

                                                                                                                                                    // ─────────────────────────────────────────────
                                                                                                                                                        // EVENTS
                                                                                                                                                            // ─────────────────────────────────────────────

                                                                                                                                                                event PayrollCreated(
                                                                                                                                                                            address indexed employer,
                                                                                                                                                                                    address indexed payroll,
                                                                                                                                                                                            string label,
                                                                                                                                                                                                    uint256 version
                                                                                                                                                                );

                                                                                                                                                                    event EmployeeRegistered(
                                                                                                                                                                                address indexed employee,
                                                                                                                                                                                        address indexed payroll
                                                                                                                                                                    );

                                                                                                                                                                        event ImplementationUpdated(
                                                                                                                                                                                    uint256 indexed version,
                                                                                                                                                                                            address indexed implementation
                                                                                                                                                                        );

                                                                                                                                                                            event LatestVersionUpdated(
                                                                                                                                                                                        uint256 indexed version
                                                                                                                                                                            );

                                                                                                                                                                                // ─────────────────────────────────────────────
                                                                                                                                                                                    // CONSTRUCTOR
                                                                                                                                                                                        // ─────────────────────────────────────────────

                                                                                                                                                                                            constructor(address _settlementToken) {

                                                                                                                                                                                                        owner = msg.sender;

                                                                                                                                                                                                                settlementToken = _settlementToken;

                                                                                                                                                                                                                        latestVersion = 2;
                                                                                                                                                                                            }

                                                                                                                                                                                                // ─────────────────────────────────────────────
                                                                                                                                                                                                    // ADMIN
                                                                                                                                                                                                        // ─────────────────────────────────────────────

                                                                                                                                                                                                            function setImplementation(
                                                                                                                                                                                                                        uint256 version,
                                                                                                                                                                                                                                address implementation
                                                                                                                                                                                                            ) external onlyOwner {

                                                                                                                                                                                                                        implementations[version] =
                                                                                                                                                                                                                                    implementation;

                                                                                                                                                                                                                                            emit ImplementationUpdated(
                                                                                                                                                                                                                                                            version,
                                                                                                                                                                                                                                                                        implementation
                                                                                                                                                                                                                                            );
                                                                                                                                                                                                            }

                                                                                                                                                                                                                function setLatestVersion(
                                                                                                                                                                                                                            uint256 version
                                                                                                                                                                                                                ) external onlyOwner {

                                                                                                                                                                                                                            latestVersion = version;

                                                                                                                                                                                                                                    emit LatestVersionUpdated(version);
                                                                                                                                                                                                                }

                                                                                                                                                                                                                    function updateSettlementToken(
                                                                                                                                                                                                                                address token
                                                                                                                                                                                                                    ) external onlyOwner {

                                                                                                                                                                                                                                settlementToken = token;
                                                                                                                                                                                                                    }

                                                                                                                                                                                                                        // ─────────────────────────────────────────────
                                                                                                                                                                                                                            // CREATE PAYROLL
                                                                                                                                                                                                                                // ─────────────────────────────────────────────

                                                                                                                                                                                                                                    function createPayroll(
                                                                                                                                                                                                                                                uint256 payPeriodSeconds,
                                                                                                                                                                                                                                                        uint256 firstPayDate,
                                                                                                                                                                                                                                                                string calldata label
                                                                                                                                                                                                                                    ) external returns (address payrollAddress) {

                                                                                                                                                                                                                                                PayrollV2 payroll = new PayrollV2(
                                                                                                                                                                                                                                                                settlementToken,
                                                                                                                                                                                                                                                                            payPeriodSeconds,
                                                                                                                                                                                                                                                                                        firstPayDate,
                                                                                                                                                                                                                                                                                                    label,
                                                                                                                                                                                                                                                                                                                address(this),
                                                                                                                                                                                                                                                                                                                            latestVersion
                                                                                                                                                                                                                                                );

                                                                                                                                                                                                                                                        payroll.transferOwnership(msg.sender);

                                                                                                                                                                                                                                                                payrollAddress = address(payroll);

                                                                                                                                                                                                                                                                        allPayrolls.push(payrollAddress);

                                                                                                                                                                                                                                                                                employerPayrolls[msg.sender]
                                                                                                                                                                                                                                                                                            .push(payrollAddress);

                                                                                                                                                                                                                                                                                                    isPayroll[payrollAddress] = true;

                                                                                                                                                                                                                                                                                                            payrollEmployer[payrollAddress] =
                                                                                                                                                                                                                                                                                                                        msg.sender;

                                                                                                                                                                                                                                                                                                                                payrollVersion[payrollAddress] =
                                                                                                                                                                                                                                                                                                                                            latestVersion;

                                                                                                                                                                                                                                                                                                                                                    payrollChainId[payrollAddress] =
                                                                                                                                                                                                                                                                                                                                                                block.chainid;

                                                                                                                                                                                                                                                                                                                                                                        emit PayrollCreated(
                                                                                                                                                                                                                                                                                                                                                                                        msg.sender,
                                                                                                                                                                                                                                                                                                                                                                                                    payrollAddress,
                                                                                                                                                                                                                                                                                                                                                                                                                label,
                                                                                                                                                                                                                                                                                                                                                                                                                            latestVersion
                                                                                                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                        // ─────────────────────────────────────────────
                                                                                                                                                                                                                                            // EMPLOYEE REGISTRATION
                                                                                                                                                                                                                                                // ─────────────────────────────────────────────

                                                                                                                                                                                                                                                    function registerEmployee(
                                                                                                                                                                                                                                                                address employee
                                                                                                                                                                                                                                                    ) external {

                                                                                                                                                                                                                                                                require(
                                                                                                                                                                                                                                                                                isPayroll[msg.sender],
                                                                                                                                                                                                                                                                                            "Invalid payroll"
                                                                                                                                                                                                                                                                );

                                                                                                                                                                                                                                                                        address[] storage existing =
                                                                                                                                                                                                                                                                                    employeePayrolls[employee];

                                                                                                                                                                                                                                                                                            for (uint256 i = 0; i < existing.length; i++) {
                                                                                                                                                                                                                                                                                                            if (existing[i] == msg.sender) {
                                                                                                                                                                                                                                                                                                                                return;
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                    employeePayrolls[employee]
                                                                                                                                                                                                                                                                                                                .push(msg.sender);

                                                                                                                                                                                                                                                                                                                        emit EmployeeRegistered(
                                                                                                                                                                                                                                                                                                                                        employee,
                                                                                                                                                                                                                                                                                                                                                    msg.sender
                                                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                        // ─────────────────────────────────────────────
                                                                                                                                                                                                                                                            // VIEWS
                                                                                                                                                                                                                                                                // ─────────────────────────────────────────────

                                                                                                                                                                                                                                                                    function getEmployerPayrolls(
                                                                                                                                                                                                                                                                                address employer
                                                                                                                                                                                                                                                                    ) external view returns (address[] memory) {

                                                                                                                                                                                                                                                                                return employerPayrolls[employer];
                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                        function getEmployeePayrolls(
                                                                                                                                                                                                                                                                                    address employee
                                                                                                                                                                                                                                                                        ) external view returns (address[] memory) {

                                                                                                                                                                                                                                                                                    return employeePayrolls[employee];
                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                            function getAllPayrolls()
                                                                                                                                                                                                                                                                                    external
                                                                                                                                                                                                                                                                                            view
                                                                                                                                                                                                                                                                                                    returns (address[] memory)
                                                                                                                                                                                                                                                                                                        {
                                                                                                                                                                                                                                                                                                                    return allPayrolls;
                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                            function totalPayrolls()
                                                                                                                                                                                                                                                                                                                    external
                                                                                                                                                                                                                                                                                                                            view
                                                                                                                                                                                                                                                                                                                                    returns (uint256)
                                                                                                                                                                                                                                                                                                                                        {
                                                                                                                                                                                                                                                                                                                                                    return allPayrolls.length;
                                                                                                                                                                                                                                                                                                                                        }
}
                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                )
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                )
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                    )
                                                                                                                                                                                                                }
                                                                                                                                                                                                                )
                                                                                                                                                                                                                                            )
                                                                                                                                                                                                            }
                                                                                                                                                                                                            )
                                                                                                                                                                                            }
                                                                                                                                                                            )
                                                                                                                                                                        )
                                                                                                                                                                    )
                                                                                                                                                                )
                        }
}