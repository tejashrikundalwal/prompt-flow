import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Spinner,
  Card,
  Form,
  Row,
  Col,
  Image,
  Tabs,
  Tab,
  Dropdown,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { userService } from '../services/userService';
import { accountService } from '../services/accountService';
import { reportsService } from '../services/reportsService';
import { urlService } from '../services/urlService';
import { creditService } from '../services/creditService';
import {
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FcClearFilters } from "react-icons/fc";
import noRecordFound from "../assets/images/no-record.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import reportsIcon from "../assets/images/icons/reportsIcon.png";
import filterLinesIcon from "../assets/images/icons/FiltersLinesIcon.png";
import recordReadyIcon from "../assets/images/icons/ready.png";
import { IoFilterOutline } from "react-icons/io5";
import { formatDateForAPI } from '../utils/dateUtils';

const Reports = () => {
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: "",
    accountId: "",
    fromDate: "",
    toDate: "",
  });
  const [urlHistory, setUrlHistory] = useState([]);
  const [urlHistoryLoading, setUrlHistoryLoading] = useState(false);
  const [urlHistorySearchTerm, setUrlHistorySearchTerm] = useState("");
  const [urlHistoryStartDate, setUrlHistoryStartDate] = useState(null);
  const [urlHistoryEndDate, setUrlHistoryEndDate] = useState(null);
  const [isUrlHistorySearching, setIsUrlHistorySearching] = useState(false);
  const [urlHistorySearchTimeout, setUrlHistorySearchTimeout] = useState(null);
  const [isUrlHistoryDownloading, setIsUrlHistoryDownloading] = useState(false);
  const [filter, setFilter] = useState({ column: "", value: "" });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [urlHistoryFilters, setUrlHistoryFilters] = useState({
    campaignName: "",
    senderId: "",
    indivId: "",
  });
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);
  const [isCreditHistoryDownloading, setIsCreditHistoryDownloading] =
    useState(false);
  const [creditHistoryStartDate, setCreditHistoryStartDate] = useState(null);
  const [creditHistoryEndDate, setCreditHistoryEndDate] = useState(null);
  const [creditHistoryFilters, setCreditHistoryFilters] = useState({
    transactionType: "",
    creditType: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [activeTab, setActiveTab] = useState("clickData");
  const [userCreatedAt, setUserCreatedAt] = useState(null);
  const [creditConsumption, setCreditConsumption] = useState([]);
  const [creditConsumptionLoading, setCreditConsumptionLoading] =
    useState(false);
  const [isCreditConsumptionDownloading, setIsCreditConsumptionDownloading] =
    useState(false);
  const [creditConsumptionStartDate, setCreditConsumptionStartDate] =
    useState(null);
  const [creditConsumptionEndDate, setCreditConsumptionEndDate] =
    useState(null);
  const [creditConsumptionFilters, setCreditConsumptionFilters] = useState({
    transactionType: "DEBIT",
    creditType: "",
  });

  const [clickDataFilterOpen, setClickDataFilterOpen] = useState(false);
  const [urlHistoryFilterOpen, setUrlHistoryFilterOpen] = useState(false);
  const [creditHistoryFilterOpen, setCreditHistoryFilterOpen] = useState(false);
  const [creditConsumptionFilterOpen, setCreditConsumptionFilterOpen] = useState(false);

  const [clickDataAccountId, setClickDataAccountId] = useState("");
  const [urlHistoryAccountId, setUrlHistoryAccountId] = useState("");
  const [creditHistoryAccountId, setCreditHistoryAccountId] = useState("");
  const [creditConsumptionAccountId, setCreditConsumptionAccountId] = useState("");

  // SFTP Destination states
  const [sftpCurrentStep, setSftpCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [sftpFormData, setSftpFormData] = useState({
    destinationName: "",
    host: "",
    port: "22",
    username: "",
    password: "",
    remoteDirectory: "",
    filePrefix: "testing",
    notifyEmail: "",
    exportDataType: "",
    exportSegment: "",
    secureFile: false,
    delimiter: "",
  });
  const [sftpSchedule, setSftpSchedule] = useState({
    scheduleType: "One time",
    date: "11/10/2025",
    time: "02:05 PM",
  });
  const [dataMappings, setDataMappings] = useState([
    { sourceKey: "Demographic_Records_CourtesyTitle", fileAttribute: "Demographic_Records_CourtesyTitle" },
    { sourceKey: "Demographic_Records_FirstName", fileAttribute: "Demographic_Records_FirstName" },
    { sourceKey: "Demographic_Records_FullName", fileAttribute: "Demographic_Records_FullName" },
    { sourceKey: "Demographic_Records_LastName", fileAttribute: "Demographic_Records_LastName" },
    { sourceKey: "Demographic_Records_MiddleName", fileAttribute: "Demographic_Records_MiddleName" },
    { sourceKey: "Demographic_Records_Suffix", fileAttribute: "Demographic_Records_Suffix" },
    { sourceKey: "Demographic_Records_MobilePhone", fileAttribute: "Demographic_Records_MobilePhone" },
    { sourceKey: "Demographic_Records_PrimaryEmail", fileAttribute: "Demographic_Records_PrimaryEmail" },
    { sourceKey: "Demographic_Records_BirthDate", fileAttribute: "Demographic_Records_BirthDate" },
    { sourceKey: "Demographic_Records_BirthDayAndMonth", fileAttribute: "Demographic_Records_BirthDayAndMonth" },
  ]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const role = decoded.roles[0];
        setUserRole(role);
        if (role === "SUPERADMIN") {
          fetchAccounts();
        } else {
          const accountId = decoded.accountId || decoded.companyId;
          setFormData((prev) => ({ ...prev, accountId }));
          setSelectedAccountId(accountId);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode(token);
          const username = decoded.sub;

          const response = await userService.getUserByUsername(username);

          setUserCreatedAt(new Date(response.createdAt));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to fetch user details");
      }
    };

    fetchUserDetails();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await accountService.getAccountConfigs();
      setAccounts(response);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch accounts");
    }
  };

  const fetchClickData = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const filterData = {
        ...formData,
        campaignName: filter.value,
        fromDate: formatDateForAPI(startDate),
        toDate: formatDateForAPI(endDate),
      };

      const response = await reportsService.getClickData(filterData);
      setClickData(response);
      toast.success("Data fetched successfully");
    } catch (error) {
      console.error("Error fetching click data:", error);
      toast.error("Failed to fetch click data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");

      const response = await reportsService.exportClickData({
        accountId: userRole === "SUPERADMIN" ? selectedAccountId : formData.accountId,
        campaignName: filter.value || "",
        fromDate: formatDateForAPI(startDate),
        toDate: formatDateForAPI(endDate),
      });

      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `click-data-${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Click Data report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading click data:", error);
      toast.error("Failed to download click data");
    } finally {
      setDownloading(false);
    }
  };

  const handleUrlHistoryDateChange = (date, isStartDate) => {
    if (isStartDate) {
      setUrlHistoryStartDate(date);
      if (urlHistoryEndDate && date > urlHistoryEndDate) {
        setUrlHistoryEndDate(date);
      }
    } else {
      setUrlHistoryEndDate(date);
      if (urlHistoryStartDate && date < urlHistoryStartDate) {
        setUrlHistoryStartDate(date);
      }
    }
  };

  const handleUrlHistorySearch = async () => {
    setIsUrlHistorySearching(true);
    try {
      const token = localStorage.getItem("token");
      
      const requestPayload = {
        accountId: userRole === "SUPERADMIN" ? urlHistoryAccountId : formData.accountId,
        campaignName: urlHistoryFilters.campaignName || "",
        senderId: urlHistoryFilters.senderId || "",
        individualId: urlHistoryFilters.indivId || "",
        fromDate: formatDateForAPI(urlHistoryStartDate),
        toDate: formatDateForAPI(urlHistoryEndDate)
      };

      const response = await urlService.searchUrlMappings(requestPayload);
      
      setUrlHistory(response.content || response.data?.content || []);
    } catch (error) {
      console.error("Error searching URL history:", error);
      toast.error("Failed to search URL history");
    } finally {
      setIsUrlHistorySearching(false);
    }
  };

  const handleUrlHistoryFilterChange = (field, value) => {
    setUrlHistoryFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearUrlHistoryFilters = () => {
    setUrlHistoryFilters({
      campaignName: "",
      senderId: "",
      indivId: "",
    });
    setUrlHistoryStartDate(null);
    setUrlHistoryEndDate(null);
  };

  const debouncedUrlHistorySearch = (value) => {
    setUrlHistorySearchTerm(value);

    if (urlHistorySearchTimeout) {
      clearTimeout(urlHistorySearchTimeout);
    }

    const timeoutId = setTimeout(() => {
      handleUrlHistorySearch();
    }, 500);

    setUrlHistorySearchTimeout(timeoutId);
  };

  const handleUrlHistoryDownload = async () => {
    try {
      setIsUrlHistoryDownloading(true);
      const token = localStorage.getItem("token");

      const requestPayload = {
        accountId: userRole === "SUPERADMIN" ? urlHistoryAccountId : formData.accountId,
        campaignName: urlHistoryFilters.campaignName || "",
        senderId: urlHistoryFilters.senderId || "",
        individualId: urlHistoryFilters.indivId || "",
        fromDate: formatDateForAPI(urlHistoryStartDate),
        toDate: formatDateForAPI(urlHistoryEndDate)
      };

      const response = await urlService.exportUrlMappings(requestPayload);

      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `url-history-${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("URL History report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading URL history:", error);
      toast.error("Failed to download URL history");
    } finally {
      setIsUrlHistoryDownloading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilter((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date, isStartDate) => {
    if (isStartDate) {
      setStartDate(date);
      if (endDate && date > endDate) {
        setEndDate(date);
      }
    } else {
      setEndDate(date);
      if (startDate && date < startDate) {
        setStartDate(date);
      }
    }
  };

  const handleCreditHistoryDateChange = (date, isStartDate) => {
    if (isStartDate) {
      setCreditHistoryStartDate(date);
      if (creditHistoryEndDate && date > creditHistoryEndDate) {
        setCreditHistoryEndDate(date);
      }
    } else {
      setCreditHistoryEndDate(date);
      if (creditHistoryStartDate && date < creditHistoryStartDate) {
        setCreditHistoryStartDate(date);
      }
    }
  };

  const handleCreditHistoryFilterChange = (field, value) => {
    setCreditHistoryFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreditHistorySearch = async () => {
    setCreditHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await creditService.searchCreditHistory({
        accountId: userRole === "SUPERADMIN" ? creditHistoryAccountId : formData.accountId,
        transactionType: creditHistoryFilters.transactionType || "",
        exceptConsumption: true,
        creditType: creditHistoryFilters.creditType || "",
        fromDate: formatDateForAPI(creditHistoryStartDate),
        toDate: formatDateForAPI(creditHistoryEndDate),
      });
      setCreditHistory(response.content || []);
    } catch (error) {
      console.error("Error searching credit history:", error);
      toast.error("Failed to search credit history");
    } finally {
      setCreditHistoryLoading(false);
    }
  };

  const handleCreditHistoryDownload = async () => {
    try {
      setIsCreditHistoryDownloading(true);
      const token = localStorage.getItem("token");

      const response = await creditService.exportCreditHistory({
        accountId: userRole === "SUPERADMIN" ? creditHistoryAccountId : formData.accountId,
        transactionType: creditHistoryFilters.transactionType || "",
        exceptConsumption: true,
        creditType: creditHistoryFilters.creditType || "",
        fromDate: formatDateForAPI(creditHistoryStartDate),
        toDate: formatDateForAPI(creditHistoryEndDate),
      });

      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `credit-history-${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Credit History report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading credit history:", error);
      toast.error("Failed to download credit history");
    } finally {
      setIsCreditHistoryDownloading(false);
    }
  };

  const handleAccountChange = (accountId) => {
    switch(activeTab) {
      case 'clickData':
        setClickDataAccountId(accountId);
        setFormData((prev) => ({ ...prev, accountId }));
        setClickData([]);
        break;
      case 'urlHistory':
        setUrlHistoryAccountId(accountId);
        setUrlHistory([]);
        break;
      case 'creditHistory':
        setCreditHistoryAccountId(accountId);
        setCreditHistory([]);
        break;
      case 'creditConsumption':
        setCreditConsumptionAccountId(accountId);
        setCreditConsumption([]);
        break;
    }
  };

  const handleCreditConsumptionDateChange = (date, isStartDate) => {
    if (isStartDate) {
      setCreditConsumptionStartDate(date);
      if (creditConsumptionEndDate && date > creditConsumptionEndDate) {
        setCreditConsumptionEndDate(date);
      }
    } else {
      setCreditConsumptionEndDate(date);
      if (creditConsumptionStartDate && date < creditConsumptionStartDate) {
        setCreditConsumptionStartDate(date);
      }
    }
  };

  const handleCreditConsumptionFilterChange = (field, value) => {
    setCreditConsumptionFilters((prev) => ({
      ...prev,
      [field]: value,
      transactionType: "DEBIT",
    }));
  };

  const handleCreditConsumptionSearch = async () => {
    setCreditConsumptionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await creditService.searchCreditHistory({
        accountId: userRole === "SUPERADMIN" ? creditConsumptionAccountId : formData.accountId,
        transactionType: creditConsumptionFilters.transactionType || "",
        exceptConsumption: false,
        creditType: creditConsumptionFilters.creditType || "",
        fromDate: creditConsumptionStartDate
          ? creditConsumptionStartDate.toISOString().split("T")[0]
          : "",
        toDate: creditConsumptionEndDate
          ? creditConsumptionEndDate.toISOString().split("T")[0]
          : "",
      });
      setCreditConsumption(response.content || []);
    } catch (error) {
      console.error("Error searching credit consumption:", error);
      toast.error("Failed to search credit consumption");
    } finally {
      setCreditConsumptionLoading(false);
    }
  };

  const handleCreditConsumptionDownload = async () => {
    try {
      setIsCreditConsumptionDownloading(true);
      const token = localStorage.getItem("token");

      const response = await creditService.exportCreditHistory({
        accountId: userRole === "SUPERADMIN" ? creditConsumptionAccountId : formData.accountId,
        transactionType: creditConsumptionFilters.transactionType || "",
        exceptConsumption: false,
        creditType: creditConsumptionFilters.creditType || "",
        fromDate: creditConsumptionStartDate
          ? creditConsumptionStartDate.toISOString().split("T")[0]
          : "",
        toDate: creditConsumptionEndDate
          ? creditConsumptionEndDate.toISOString().split("T")[0]
          : "",
      });

      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `credit-consumption-${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Credit Consumption report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading credit consumption:", error);
      toast.error("Failed to download credit consumption");
    } finally {
      setIsCreditConsumptionDownloading(false);
    }
  };

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // SFTP handlers
  const handleSftpInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSftpFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSftpScheduleChange = (field, value) => {
    setSftpSchedule((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDataMappingChange = (index, field, value) => {
    const newMappings = [...dataMappings];
    newMappings[index][field] = value;
    setDataMappings(newMappings);
  };

  const handleSftpNextStep = () => {
    if (sftpCurrentStep < 4) {
      setSftpCurrentStep(sftpCurrentStep + 1);
    }
  };

  const handleSftpPrevStep = () => {
    if (sftpCurrentStep > 1) {
      setSftpCurrentStep(sftpCurrentStep - 1);
    }
  };

  const handleSftpFinish = () => {
    console.log("SFTP Form Data:", sftpFormData);
    console.log("Schedule:", sftpSchedule);
    console.log("Data Mappings:", dataMappings);
    toast.success("SFTP Destination created successfully!");
    setSftpCurrentStep(1);
  };

  const renderSftpStepIndicator = () => {
    const steps = [
      { number: 1, label: "Setup", icon: "!" },
      { number: 2, label: "Data Mapping", icon: "⚭" },
      { number: 3, label: "Schedule", icon: "☸" },
      { number: 4, label: "Review", icon: "↻" },
    ];

    return (
      <div className="d-flex align-items-center justify-content-between mb-4 position-relative">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="d-flex flex-column align-items-center" style={{ zIndex: 1 }}>
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center ${
                  sftpCurrentStep >= step.number
                    ? "bg-danger text-white"
                    : "bg-light text-muted"
                }`}
                style={{
                  width: "40px",
                  height: "40px",
                  border: sftpCurrentStep >= step.number ? "2px solid #dc3545" : "2px solid #dee2e6",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                {step.icon}
              </div>
              <span
                className={`mt-2 fs-12 ${
                  sftpCurrentStep >= step.number ? "text-dark fw-600" : "text-muted fw-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="flex-grow-1 mx-2"
                style={{
                  height: "2px",
                  background:
                    sftpCurrentStep > step.number
                      ? "#dc3545"
                      : "#dee2e6",
                  marginBottom: "30px",
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderSftpSetupStep = () => (
    <div>
      <h5 className="mb-3 fs-16 fw-600">SFTP details</h5>
      <p className="text-muted fs-12 mb-4">Provide basic details about your SFTP destination</p>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Destination Name</Form.Label>
            <Form.Control
              type="text"
              name="destinationName"
              value={sftpFormData.destinationName}
              onChange={handleSftpInputChange}
              placeholder="Enter destination name"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Delimiter</Form.Label>
            <Form.Control
              type="text"
              name="delimiter"
              value={sftpFormData.delimiter || ""}
              onChange={handleSftpInputChange}
              placeholder="Enter delimiter"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Host</Form.Label>
            <Form.Control
              type="text"
              name="host"
              value={sftpFormData.host}
              onChange={handleSftpInputChange}
              placeholder="e.g., 192.168.0.1"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Port</Form.Label>
            <Form.Control
              type="text"
              name="port"
              value={sftpFormData.port}
              onChange={handleSftpInputChange}
              placeholder="22"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Username</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={sftpFormData.username}
              onChange={handleSftpInputChange}
              placeholder="Enter username"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Password</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                value={sftpFormData.password}
                onChange={handleSftpInputChange}
                placeholder="••••••••••••••••"
                className="br-radius-8"
              />
              <Button
                variant="link"
                className="position-absolute end-0 top-50 translate-middle-y"
                onClick={() => setShowPassword(!showPassword)}
                style={{ textDecoration: "none", color: "#666" }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </div>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Remote Directory</Form.Label>
            <Form.Control
              type="text"
              name="remoteDirectory"
              value={sftpFormData.remoteDirectory}
              onChange={handleSftpInputChange}
              placeholder="Enter remote directory"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">File Prefix</Form.Label>
            <Form.Control
              type="text"
              name="filePrefix"
              value={sftpFormData.filePrefix}
              onChange={handleSftpInputChange}
              placeholder="testing"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Notify Email</Form.Label>
            <Form.Control
              type="email"
              name="notifyEmail"
              value={sftpFormData.notifyEmail}
              onChange={handleSftpInputChange}
              placeholder="Enter notify email"
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Export Data Type</Form.Label>
            <Form.Select
              name="exportDataType"
              value={sftpFormData.exportDataType}
              onChange={handleSftpInputChange}
              className="br-radius-8"
            >
              <option value="">Select data type</option>
              <option value="isdefault">isdefault</option>
              <option value="custom">custom</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Export Segment</Form.Label>
            <Form.Select
              name="exportSegment"
              value={sftpFormData.exportSegment}
              onChange={handleSftpInputChange}
              className="br-radius-8"
            >
              <option value="">Select segment</option>
              <option value="Multidataset">Multidataset</option>
              <option value="Single">Single</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Check
          type="checkbox"
          name="secureFile"
          checked={sftpFormData.secureFile}
          onChange={handleSftpInputChange}
          label={
            <span className="fs-12">
              Secure file with encryption
              <br />
              <small className="text-muted">
                Zip file will be encrypted before uploading using encryption method, sending the gpg file
              </small>
            </span>
          }
        />
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button variant="danger" onClick={handleSftpNextStep} className="br-radius-8">
          Next
        </Button>
      </div>
    </div>
  );

  const renderDataMappingStep = () => (
    <div>
      <h5 className="mb-3 fs-16 fw-600">Data Mapping</h5>
      <p className="text-muted fs-12 mb-4">
        Specify column names for file to map source columns
      </p>

      <div className="mb-3 text-end">
        <span className="fs-12 text-muted">
          {dataMappings.filter(m => m.fileAttribute).length}/{dataMappings.length} Fields mapped
        </span>
      </div>

      <Table responsive bordered hover className="align-middle">
        <thead className="bg-light">
          <tr>
            <th className="fs-12 fw-600" style={{ width: "50px" }}>
              <Form.Check type="checkbox" />
            </th>
            <th className="fs-12 fw-600">SOURCE KEY</th>
            <th className="fs-12 fw-600">FILE ATTRIBUTE</th>
            <th className="fs-12 fw-600" style={{ width: "200px" }}>
              TRANSFORMATION RULES
            </th>
          </tr>
        </thead>
        <tbody>
          {dataMappings.map((mapping, index) => (
            <tr key={index}>
              <td>
                <Form.Check type="checkbox" />
              </td>
              <td className="fs-12 text-muted">{mapping.sourceKey}</td>
              <td>
                <Form.Control
                  type="text"
                  value={mapping.fileAttribute}
                  onChange={(e) =>
                    handleDataMappingChange(index, "fileAttribute", e.target.value)
                  }
                  className="br-radius-8 fs-12"
                  placeholder="Enter file attribute"
                />
              </td>
              <td className="text-center">
                <Button variant="light" size="sm" className="br-radius-8">
                  <span className="text-muted">ⓘ</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="d-flex justify-content-between mt-4">
        <Button variant="outline-danger" onClick={handleSftpPrevStep} className="br-radius-8">
          Back
        </Button>
        <Button variant="danger" onClick={handleSftpNextStep} className="br-radius-8">
          Next
        </Button>
      </div>
    </div>
  );

  const renderScheduleStep = () => (
    <div>
      <h5 className="mb-4 fs-16 fw-600">Schedule</h5>

      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Schedule</Form.Label>
            <Form.Select
              value={sftpSchedule.scheduleType}
              onChange={(e) => handleSftpScheduleChange("scheduleType", e.target.value)}
              className="br-radius-8"
            >
              <option value="One time">One time</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Date</Form.Label>
            <Form.Control
              type="date"
              value={sftpSchedule.date}
              onChange={(e) => handleSftpScheduleChange("date", e.target.value)}
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fs-12">Time</Form.Label>
            <Form.Control
              type="time"
              value={sftpSchedule.time}
              onChange={(e) => handleSftpScheduleChange("time", e.target.value)}
              className="br-radius-8"
            />
          </Form.Group>
        </Col>
      </Row>

      <p className="text-muted fs-12 mt-2">
        Note: The time should be in Asia/Calcutta timezone.
      </p>

      <div className="d-flex justify-content-between mt-5">
        <Button variant="outline-danger" onClick={handleSftpPrevStep} className="br-radius-8">
          Back
        </Button>
        <Button variant="danger" onClick={handleSftpNextStep} className="br-radius-8">
          Next
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div>
      <h5 className="mb-4 fs-16 fw-600">Step 4</h5>
      <h6 className="mb-4 fs-14 fw-600">Review</h6>

      <Row>
        <Col md={6}>
          <Card className="mb-4 br-radius-12">
            <Card.Body className="p-4">
              <div className="text-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "2px solid #FFA500",
                  }}
                >
                  <span style={{ fontSize: "24px", color: "#FFA500" }}>⚭</span>
                </div>
                <h6 className="fw-600 fs-14">Connection</h6>
              </div>

              <Row className="mb-2">
                <Col xs={6}>
                  <p className="fs-12 text-muted mb-1">Destination Name</p>
                </Col>
                <Col xs={6}>
                  <p className="fs-12 fw-600 mb-1">{sftpFormData.destinationName || "N/A"}</p>
                </Col>
              </Row>

              <Row className="mb-2">
                <Col xs={6}>
                  <p className="fs-12 text-muted mb-1">Destination Platform</p>
                </Col>
                <Col xs={6}>
                  <p className="fs-12 fw-600 mb-1">SFTP</p>
                </Col>
              </Row>

              <Row className="mb-2">
                <Col xs={6}>
                  <p className="fs-12 text-muted mb-1">SEGMENT</p>
                </Col>
                <Col xs={6}>
                  <p className="fs-12 fw-600 mb-1">{sftpFormData.exportSegment || "N/A"}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4 br-radius-12">
            <Card.Body className="p-4">
              <div className="text-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "2px solid #FFA500",
                  }}
                >
                  <span style={{ fontSize: "24px", color: "#FFA500" }}>📅</span>
                </div>
                <h6 className="fw-600 fs-14">Schedule</h6>
              </div>

              <Row className="mb-2">
                <Col xs={6}>
                  <p className="fs-12 text-muted mb-1">Frequency</p>
                </Col>
                <Col xs={6}>
                  <p className="fs-12 fw-600 mb-1">{sftpSchedule.scheduleType || "ONCE"}</p>
                </Col>
              </Row>

              <Row className="mb-2">
                <Col xs={6}>
                  <p className="fs-12 text-muted mb-1">Date</p>
                </Col>
                <Col xs={6}>
                  <p className="fs-12 fw-600 mb-1">{sftpSchedule.date || "N/A"}</p>
                </Col>
              </Row>

              <Row className="mb-2">
                <Col xs={6}>
                  <p className="fs-12 text-muted mb-1">Time</p>
                </Col>
                <Col xs={6}>
                  <p className="fs-12 fw-600 mb-1">
                    {sftpSchedule.time ? `${sftpSchedule.time} PM IST` : "N/A"}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-4">
        <Button variant="outline-danger" onClick={handleSftpPrevStep} className="br-radius-8">
          Back
        </Button>
        <Button variant="danger" onClick={handleSftpFinish} className="br-radius-8">
          Finish
        </Button>
      </div>
    </div>
  );

  const renderSearchTerms = () => {
    switch (activeTab) {
      case 'clickData':
        return (
          <>
            {userRole === "SUPERADMIN" && clickDataAccountId && (
              <Row className="mb-2 align-items-center">
                <Col sm={6} className="text-start">
                  <h6 className="mb-0 text-616161 fw-400 fs-12">Account</h6>
                </Col>
                <Col sm={6} className="text-start">
                  <p className="mb-0 fs-14 text-dark fw-600">
                    {accounts.find(acc => acc.id === clickDataAccountId)?.accountName}
                  </p>
                </Col>
              </Row>
            )}
            {filter.column && filter.value && (
              <Row className="mb-2 align-items-center">
                <Col sm={6} className="text-start">
                  <h6 className="mb-0 text-616161 fw-400 fs-12">{filter.column}</h6>
                </Col>
                <Col sm={6} className="text-start">
                  <p className="mb-0 fs-14 text-dark fw-600">{filter.value}</p>
                </Col>
              </Row>
            )}
          </>
        );
      case 'urlHistory':
        return (
          <>
            {userRole === "SUPERADMIN" && urlHistoryAccountId && (
              <Row className="mb-2 align-items-center">
                <Col sm={6} className="text-start">
                  <h6 className="mb-0 text-616161 fw-400 fs-12">Account</h6>
                </Col>
                <Col sm={6} className="text-start">
                  <p className="mb-0 fs-14 text-dark fw-600">
                    {accounts.find(acc => acc.id === urlHistoryAccountId)?.accountName}
                  </p>
                </Col>
              </Row>
            )}
            {Object.entries(urlHistoryFilters).map(([key, value]) => 
              value && (
                <Row key={key} className="mb-2 align-items-center">
                  <Col sm={6} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">
                      {key === "campaignName" ? "Campaign" : 
                       key === "senderId" ? "Sender ID" : 
                       key === "indivId" ? "Individual ID" : key}
                    </h6>
                  </Col>
                  <Col sm={6} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{value}</p>
                  </Col>
                </Row>
              )
            )}
          </>
        );
      case 'creditHistory':
        return (
          <>
            {userRole === "SUPERADMIN" && creditHistoryAccountId && (
              <Row className="mb-2 align-items-center">
                <Col sm={6} className="text-start">
                  <h6 className="mb-0 text-616161 fw-400 fs-12">Account</h6>
                </Col>
                <Col sm={6} className="text-start">
                  <p className="mb-0 fs-14 text-dark fw-600">
                    {accounts.find(acc => acc.id === creditHistoryAccountId)?.accountName}
                  </p>
                </Col>
              </Row>
            )}
            {Object.entries(creditHistoryFilters).map(([key, value]) => 
              value && (
                <Row key={key} className="mb-2 align-items-center">
                  <Col sm={6} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">
                      {key === "transactionType" ? "Transaction Type" : 
                       key === "creditType" ? "Credit Type" : key}
                    </h6>
                  </Col>
                  <Col sm={6} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{value}</p>
                  </Col>
                </Row>
              )
            )}
          </>
        );
      case 'creditConsumption':
        return (
          <>
            {userRole === "SUPERADMIN" && creditConsumptionAccountId && (
              <Row className="mb-2 align-items-center">
                <Col sm={6} className="text-start">
                  <h6 className="mb-0 text-616161 fw-400 fs-12">Account</h6>
                </Col>
                <Col sm={6} className="text-start">
                  <p className="mb-0 fs-14 text-dark fw-600">
                    {accounts.find(acc => acc.id === creditConsumptionAccountId)?.accountName}
                  </p>
                </Col>
              </Row>
            )}
            {Object.entries(creditConsumptionFilters).map(([key, value]) => 
              value && (
                <Row key={key} className="mb-2 align-items-center">
                  <Col sm={6} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">
                      {key === "transactionType" ? "Transaction Type" : 
                       key === "creditType" ? "Credit Type" : key}
                    </h6>
                  </Col>
                  <Col sm={6} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{value}</p>
                  </Col>
                </Row>
              )
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="p-4 mt-5">
      <Card className="card-nostyle border-0 shadow-none">
        <Card.Body className="ps-0 pe-0">
          <div
            className="d-flex justify-content-between ps-4 pe-4 align-items-center"
            style={{ borderBottom: "1px solid #EAECF0" }}
          >
            <h4 className="mb-0 bg-white br-radius-12 rounded-bottom-0 pb-3 fs-20 poppins fw-600">
              <Image src={reportsIcon} className="me-1" width="12" /> Reports
            </h4>
          </div>
        </Card.Body>
      </Card>

      <div className="main-container pt-0">
        <Row>
          <Col lg={12}>
            <Card className="br-radius-12 card-nostyle">
              <Card.Body className="p-0">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  id="reports-tabs"
                  className="mb-4 cust-tab border-bottom"
                  justify
                >
                  <Tab eventKey="clickData" title="Click Data">
                    <div className="main-container p-0">
                      <Row>
                        <Col lg={12}>
                          <Card className="br-radius-0 card-nostyle">
                            <Card.Header className="bg-white border-0 br-radius-12 rounded-bottom-0 fs-20 d-flex p-0">
                            </Card.Header>

                            <Card.Body className="p-0">
                              <div className="mb-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Dropdown
                                    show={clickDataFilterOpen}
                                    onToggle={(isOpen) => setClickDataFilterOpen(isOpen)}
                                  >
                                    <Dropdown.Toggle
                                      variant="white"
                                      className="d-flex cus-dropdown-toggle-show align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: `1px solid ${clickDataFilterOpen ? "#28a745" : "#EAECEE"}`,
                                      }}
                                    >
                                      <IoFilterOutline className="me-2" />
                                      <span className="fw-400 fs-12">Filter</span>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="p-3 mt-2" style={{ width: "400px" }}>
                                      <div>
                                        {userRole === "SUPERADMIN" && (
                                          <Form.Group className="mb-3">
                                            <Form.Label className="fs-12">
                                              Account Name <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Select
                                              value={clickDataAccountId}
                                              onChange={(e) => handleAccountChange(e.target.value)}
                                              className=""
                                            >
                                              <option value="">Select Account</option>
                                              {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                  {account.accountName}
                                                </option>
                                              ))}
                                            </Form.Select>
                                          </Form.Group>
                                        )}

                                        <Form.Group className="mb-2">
                                          <Form.Select
                                            value={filter.column}
                                            onChange={(e) => {
                                              handleFilterChange(
                                                "column",
                                                e.target.value
                                              );
                                              handleFilterChange("value", "");
                                            }}
                                            className=""
                                          >
                                            <option value="">
                                              Select column...
                                            </option>
                                            <option value="campaignName">
                                              Campaign Name
                                            </option>
                                          </Form.Select>
                                        </Form.Group>

                                        {filter.column && (
                                          <Form.Group className="mb-3">
                                            <Form.Control
                                              type="text"
                                              value={filter.value}
                                              onChange={(e) =>
                                                handleFilterChange(
                                                  "value",
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Enter campaign name"
                                              className=""
                                            />
                                          </Form.Group>
                                        )}

                                        <div className="mb-3">
                                          <label className="fs-12 text-616161 mb-2">
                                            Date Range <span className="text-danger">*</span>
                                          </label>
                                          <div
                                            className="d-flex align-items-center justify-content-between"
                                            style={{
                                              border: "1px solid #EAECEE",
                                              borderRadius: "8px",
                                              position: "relative",
                                            }}
                                          >
                                            <DatePicker
                                              selected={startDate}
                                              onChange={(date) =>
                                                handleDateChange(date, true)
                                              }
                                              className="form-control border-0 br-radius-32 me-2 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                              placeholderText="Start Date"
                                              maxDate={endDate || new Date()}
                                              minDate={userCreatedAt}
                                              dateFormat="MMM dd, yyyy"
                                              showMonthDropdown
                                              showYearDropdown
                                              dropdownMode="select"
                                              isClearable={false}
                                            />

                                            <span className="mx-2">⇆</span>

                                            <DatePicker
                                              selected={endDate}
                                              onChange={(date) =>
                                                handleDateChange(date, false)
                                              }
                                              className="form-control border-0 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                              placeholderText="End Date"
                                              minDate={startDate}
                                              maxDate={new Date()}
                                              dateFormat="MMM dd, yyyy"
                                              showMonthDropdown
                                              showYearDropdown
                                              dropdownMode="select"
                                              isClearable={false}
                                            />

                                            <div
                                              className="border-0 bg-transparent fs-12 d-flex align-items-center pe-2"
                                              style={{ cursor: "pointer" }}
                                              onClick={() => {
                                                setStartDate(null);
                                                setEndDate(null);
                                              }}
                                              title="Clear dates"
                                            >
                                              <FaCalendarAlt
                                                className={
                                                  startDate || endDate
                                                    ? "text-danger"
                                                    : ""
                                                }
                                                style={{
                                                  fontSize: "14px",
                                                  marginLeft: "-18px",
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        <div className="d-flex justify-content-center gap-2 mt-3">
                                          <Button
                                            variant="light"
                                            size="sm"
                                            onClick={() => {
                                              setFilter({
                                                column: "",
                                                value: "",
                                              });
                                              setStartDate(null);
                                              setEndDate(null);
                                            }}
                                            className=""
                                          >
                                            Clear all
                                          </Button>
                                          <Button
                                            variant="success"
                                            size="sm"
                                            onClick={fetchClickData}
                                            disabled={
                                              loading || 
                                              !startDate || 
                                              !endDate || 
                                              (userRole === "SUPERADMIN" && !clickDataAccountId)
                                            }
                                            className="br-radius-8"
                                          >
                                            {loading ? (
                                              <>
                                                <Spinner
                                                  size="sm"
                                                  className="me-1"
                                                />
                                                Applying...
                                              </>
                                            ) : (
                                              "Apply"
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </Dropdown.Menu>
                                  </Dropdown>

                                  {activeTab === "clickData" && ((userRole === "SUPERADMIN" && clickDataAccountId) || 
                                    (filter.column && filter.value) || 
                                    startDate || 
                                    endDate) && (
                                    <Button
                                      variant="light"
                                      size="sm"
                                      className="d-flex align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: "1px solid #EAECEE",
                                        padding: "9px 15px",
                                      }}
                                      onClick={() => {
                                        setFilter({ column: "", value: "" });
                                        setStartDate(null);
                                        setEndDate(null);
                                        if (userRole === "SUPERADMIN") {
                                          setClickDataAccountId("");
                                          setFormData((prev) => ({ ...prev, accountId: "" }));
                                        }
                                        setClickData([]);
                                      }}
                                    >
                                      <FcClearFilters size={12} />
                                      <span className="fw-400 fs-12">Clear All</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {loading ? (
                                <div className="text-center">
                                  <Spinner
                                    animation="border"
                                    variant="success"
                                  />
                                  <p className="mt-3 text-muted">
                                    Fetching your data...
                                  </p>
                                </div>
                              ) : clickData.length > 0 ? (
                                <div
                                  className="text-center"
                                  style={{
                                    background:
                                      "linear-gradient(180deg, #FFF2E5 0%, #FFFFFF 40.56%, #FFFFFF 97.56%)",
                                    width: "400px",
                                    margin: "0 auto",
                                    border: "1px solid #C2C2C2",
                                    boxShadow:
                                      "0px 10.03px 30.08px 0px #AAAAAA1F",
                                    borderRadius: "22px",
                                    padding: "35px 20px 30px 20px",
                                  }}
                                >
                                  <Image
                                    src={recordReadyIcon}
                                    width={60}
                                    className="mb-3"
                                  />
                                  <h5 className="mb-4 fw-600 poppins fs-16">
                                    Your Report is Ready!
                                  </h5>
                                  <Row className="mb-2 align-items-center">
                                    <Col sm={6} className="text-start">
                                      <h6 className="mb-0 text-616161 fw-400 fs-12">
                                        Total Records
                                      </h6>
                                    </Col>
                                    <Col sm={6} className="text-start">
                                      <p className="mb-0 fs-14 text-dark fw-600">
                                        {clickData.length}
                                      </p>
                                    </Col>
                                  </Row>
                                  <Row className="mb-2 align-items-center">
                                    <Col sm={6} className="text-start">
                                      <h6 className="mb-0 text-616161 fw-400 fs-12">
                                        Date Range
                                      </h6>
                                    </Col>
                                    <Col sm={6} className="text-start">
                                      <p className="mb-0 fs-14 text-dark fw-600">
                                        {startDate
                                          ? startDate.toLocaleDateString()
                                          : "N/A"}{" "}
                                        to{" "}
                                        {endDate
                                          ? endDate.toLocaleDateString()
                                          : "N/A"}
                                      </p>
                                    </Col>
                                  </Row>

                                  {((userRole === "SUPERADMIN" && clickDataAccountId) || 
                                    (filter.column && filter.value) || 
                                    startDate || 
                                    endDate) && (
                                    <hr className="my-3" style={{ borderColor: "#EAECEE" }} />
                                  )}

                                  {renderSearchTerms()}

                                  <div className="mt-4">
                                    <Button
                                      variant="success"
                                      onClick={handleDownloadCSV}
                                      disabled={downloading}
                                      className="d-flex align-items-center m-auto br-radius-8"
                                      style={{ whiteSpace: "nowrap" }}
                                    >
                                      {downloading ? (
                                        <>
                                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                          <span>Downloading...</span>
                                        </>
                                      ) : (
                                        <span>Download CSV</span>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Image
                                    src={noRecordFound}
                                    width={100}
                                    className="mb-3"
                                  />
                                  <h5 className="mb-1 fs-14 fw-600">
                                    No Records Found !
                                  </h5>
                                  <p className="text-muted">
                                    Use the search form above to generate your
                                    click data report
                                  </p>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="urlHistory" title="URL Shortening">
                    <div className="main-container p-0">
                      <Row>
                        <Col lg={12}>
                          <Card className="br-radius-0 card-nostyle">
                            <Card.Body className="p-0">
                              <div className="mb-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Dropdown
                                    show={urlHistoryFilterOpen}
                                    onToggle={(isOpen) => setUrlHistoryFilterOpen(isOpen)}
                                  >
                                    <Dropdown.Toggle
                                      variant="white"
                                      className="d-flex cus-dropdown-toggle-show align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: `1px solid ${urlHistoryFilterOpen ? "#28a745" : "#EAECEE"}`,
                                      }}
                                    >
                                      <IoFilterOutline className="me-2" />
                                      <span className="fw-400 fs-12">Filter</span>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="p-3 mt-2" style={{ width: "400px" }}>
                                      <div>
                                        {userRole === "SUPERADMIN" && (
                                          <Form.Group className="mb-3">
                                            <Form.Label className="fs-12">
                                              Account Name
                                            </Form.Label>
                                            <Form.Select
                                              value={urlHistoryAccountId}
                                              onChange={(e) => handleAccountChange(e.target.value)}
                                              className=""
                                            >
                                              <option value="">Select Account</option>
                                              {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                  {account.accountName}
                                                </option>
                                              ))}
                                            </Form.Select>
                                          </Form.Group>
                                        )}

                                        <Form.Group className="mb-3">
                                          <Form.Label className="fs-12">
                                            Campaign Name
                                          </Form.Label>
                                          <Form.Control
                                            type="text"
                                            value={
                                              urlHistoryFilters.campaignName
                                            }
                                            onChange={(e) =>
                                              handleUrlHistoryFilterChange(
                                                "campaignName",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Enter campaign name"
                                          />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                          <Form.Label className="fs-12">
                                            Sender ID
                                          </Form.Label>
                                          <Form.Control
                                            type="text"
                                            value={urlHistoryFilters.senderId}
                                            onChange={(e) =>
                                              handleUrlHistoryFilterChange(
                                                "senderId",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Enter sender ID"
                                          />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                          <Form.Label className="fs-12">
                                            Individual ID
                                          </Form.Label>
                                          <Form.Control
                                            type="text"
                                            value={urlHistoryFilters.indivId}
                                            onChange={(e) =>
                                              handleUrlHistoryFilterChange(
                                                "indivId",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Enter individual ID"
                                          />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                          <Form.Label className="fs-12">
                                            Date Range <span className="text-danger">*</span>
                                          </Form.Label>
                                          <div
                                            className="d-flex align-items-center justify-content-between"
                                            style={{
                                              border: "1px solid #EAECEE",
                                              borderRadius: "32px",
                                              position: "relative",
                                            }}
                                          >
                                            <DatePicker
                                              selected={urlHistoryStartDate}
                                              onChange={(date) =>
                                                handleUrlHistoryDateChange(
                                                  date,
                                                  true
                                                )
                                              }
                                              className="form-control border-0 br-radius-32 me-2 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                              placeholderText="Start Date"
                                              maxDate={
                                                urlHistoryEndDate || new Date()
                                              }
                                              minDate={userCreatedAt}
                                              dateFormat="MMM dd, yyyy"
                                            />

                                            <span className="mx-2">⇆</span>

                                            <DatePicker
                                              selected={urlHistoryEndDate}
                                              onChange={(date) =>
                                                handleUrlHistoryDateChange(
                                                  date,
                                                  false
                                                )
                                              }
                                              className="form-control border-0 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                              placeholderText="End Date"
                                              minDate={urlHistoryStartDate}
                                              maxDate={new Date()}
                                              dateFormat="MMM dd, yyyy"
                                            />

                                            <div
                                              className="border-0 bg-transparent fs-12 d-flex align-items-center pe-2"
                                              style={{ cursor: "pointer" }}
                                              onClick={() => {
                                                setUrlHistoryStartDate(null);
                                                setUrlHistoryEndDate(null);
                                                handleUrlHistorySearch();
                                              }}
                                              title="Clear dates"
                                            >
                                              <FaCalendarAlt
                                                className={
                                                  urlHistoryStartDate ||
                                                  urlHistoryEndDate
                                                    ? "text-danger"
                                                    : ""
                                                }
                                                style={{ fontSize: "14px" }}
                                              />
                                            </div>
                                          </div>
                                        </Form.Group>

                                        <div className="d-flex justify-content-center gap-2 mt-3">
                                          <Button
                                            variant="light"
                                            size="sm"
                                            onClick={() => {
                                              clearUrlHistoryFilters();
                                              if (userRole === "SUPERADMIN") {
                                                setUrlHistoryAccountId("");
                                              }
                                              setUrlHistory([]);
                                            }}
                                            className=""
                                          >
                                            Clear all
                                          </Button>
                                          <Button
                                            variant="success"
                                            size="sm"
                                            onClick={handleUrlHistorySearch}
                                            disabled={
                                              isUrlHistorySearching || 
                                              !urlHistoryStartDate || 
                                              !urlHistoryEndDate || 
                                              (userRole === "SUPERADMIN" && !urlHistoryAccountId)
                                            }
                                            className="br-radius-8"
                                          >
                                            {isUrlHistorySearching ? (
                                              <>
                                                <Spinner size="sm" className="me-1" />
                                                Applying...
                                              </>
                                            ) : (
                                              "Apply"
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </Dropdown.Menu>
                                  </Dropdown>

                                  {activeTab === "urlHistory" && ((userRole === "SUPERADMIN" && urlHistoryAccountId) || 
                                    Object.values(urlHistoryFilters).some(value => value) || 
                                    urlHistoryStartDate || 
                                    urlHistoryEndDate) && (
                                    <Button
                                      variant="light"
                                      size="sm"
                                      className="d-flex align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: "1px solid #EAECEE",
                                        padding: "9px 15px",
                                      }}
                                      onClick={() => {
                                        clearUrlHistoryFilters();
                                        if (userRole === "SUPERADMIN") {
                                          setUrlHistoryAccountId("");
                                        }
                                        setUrlHistory([]);
                                      }}
                                    >
                                      <FcClearFilters size={12} />
                                      <span className="fw-400 fs-12">Clear All</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {urlHistoryLoading ? (
                                <div className="text-center py-4">
                                  <Spinner animation="border" variant="success" />
                                  <p className="mt-3 text-muted">Loading URL history...</p>
                                </div>
                              ) : urlHistory.length > 0 ? (
                                <div
                                  className="text-center"
                                  style={{
                                    background: "linear-gradient(180deg, #FFF2E5 0%, #FFFFFF 40.56%, #FFFFFF 97.56%)",
                                    width: "400px",
                                    margin: "0 auto",
                                    border: "1px solid #C2C2C2",
                                    boxShadow: "0px 10.03px 30.08px 0px #AAAAAA1F",
                                    borderRadius: "22px",
                                    padding: "35px 20px 30px 20px",
                                  }}
                                >
                                  <Image src={recordReadyIcon} width={60} className="mb-3" />
                                  <h5 className="mb-4 fw-600 poppins fs-16">Your Report is Ready!</h5>
                                  <Row className="mb-2 align-items-center">
                                    <Col sm={6} className="text-start">
                                      <h6 className="mb-0 text-616161 fw-400 fs-12">Total Records</h6>
                                    </Col>
                                    <Col sm={6} className="text-start">
                                      <p className="mb-0 fs-14 text-dark fw-600">{urlHistory.length}</p>
                                    </Col>
                                  </Row>
                                  <Row className="mb-2 align-items-center">
                                    <Col sm={6} className="text-start">
                                      <h6 className="mb-0 text-616161 fw-400 fs-12">Date Range</h6>
                                    </Col>
                                    <Col sm={6} className="text-start">
                                      <p className="mb-0 fs-14 text-dark fw-600">
                                        {urlHistoryStartDate ? urlHistoryStartDate.toLocaleDateString() : "N/A"} to{" "}
                                        {urlHistoryEndDate ? urlHistoryEndDate.toLocaleDateString() : "N/A"}
                                      </p>
                                    </Col>
                                  </Row>

                                  {((userRole === "SUPERADMIN" && urlHistoryAccountId) || 
                                    Object.values(urlHistoryFilters).some(value => value)) && (
                                    <hr className="my-3" style={{ borderColor: "#EAECEE" }} />
                                  )}

                                  {renderSearchTerms()}

                                  <div className="mt-4">
                                    <Button
                                      variant="success"
                                      onClick={handleUrlHistoryDownload}
                                      disabled={isUrlHistoryDownloading}
                                      className="d-flex align-items-center m-auto br-radius-8"
                                      style={{ whiteSpace: "nowrap" }}
                                    >
                                      {isUrlHistoryDownloading ? (
                                        <>
                                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                          <span>Downloading...</span>
                                        </>
                                      ) : (
                                        <span>Download CSV</span>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <Image src={noRecordFound} width={100} className="mb-3" />
                                  <h5 className="mb-1 fs-14 fw-600">No Records Found</h5>
                                  <p className="text-muted">No URL history records match your search criteria</p>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="creditHistory" title="Credit Record">
                    <div className="text-center py-5">
                      <p className="text-muted">Credit History Tab - Filter and view credit history records</p>
                    </div>
                  </Tab>

                  <Tab eventKey="creditConsumption" title="Credit Consumption">
                    <div className="text-center py-5">
                      <p className="text-muted">Credit Consumption Tab - Filter and view credit consumption records</p>
                    </div>
                  </Tab>

                  <Tab eventKey="sftpDestination" title="SFTP Destination">
                    <div className="main-container p-0">
                      <Row>
                        <Col lg={12}>
                          <Card className="br-radius-0 card-nostyle">
                            <Card.Body className="p-4">
                              {renderSftpStepIndicator()}
                              
                              {sftpCurrentStep === 1 && renderSftpSetupStep()}
                              {sftpCurrentStep === 2 && renderDataMappingStep()}
                              {sftpCurrentStep === 3 && renderScheduleStep()}
                              {sftpCurrentStep === 4 && renderReviewStep()}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Reports;
