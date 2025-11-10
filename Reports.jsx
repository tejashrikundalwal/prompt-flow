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
  ProgressBar,
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
  FaChevronLeft,
  FaChevronRight,
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

  // SFTP Destination form states
  const [sftpStep, setSftpStep] = useState(1);
  const [sftpFormData, setSftpFormData] = useState({
    destinationName: "",
    description: "",
    host: "",
    port: "",
    username: "",
    password: "",
    remotePath: "",
    fileName: "",
    fileFormat: "",
    schedule: "",
    enabled: true,
  });
  const [sftpFormErrors, setSftpFormErrors] = useState({});
  const [sftpSubmitting, setSftpSubmitting] = useState(false);

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

  // SFTP Destination form handlers
  const handleSftpInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSftpFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (sftpFormErrors[name]) {
      setSftpFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateSftpStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1:
        if (!sftpFormData.destinationName.trim()) {
          errors.destinationName = "Destination name is required";
        }
        if (!sftpFormData.host.trim()) {
          errors.host = "Host is required";
        }
        if (!sftpFormData.port.trim()) {
          errors.port = "Port is required";
        } else if (isNaN(sftpFormData.port) || parseInt(sftpFormData.port) < 1 || parseInt(sftpFormData.port) > 65535) {
          errors.port = "Port must be a valid number between 1 and 65535";
        }
        break;
      case 2:
        if (!sftpFormData.username.trim()) {
          errors.username = "Username is required";
        }
        if (!sftpFormData.password.trim()) {
          errors.password = "Password is required";
        }
        if (!sftpFormData.remotePath.trim()) {
          errors.remotePath = "Remote path is required";
        }
        break;
      case 3:
        if (!sftpFormData.fileName.trim()) {
          errors.fileName = "File name is required";
        }
        if (!sftpFormData.fileFormat) {
          errors.fileFormat = "File format is required";
        }
        break;
      default:
        break;
    }
    
    setSftpFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSftpNext = () => {
    if (validateSftpStep(sftpStep)) {
      setSftpStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleSftpPrevious = () => {
    setSftpStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSftpSubmit = async () => {
    if (validateSftpStep(4)) {
      setSftpSubmitting(true);
      try {
        // TODO: Replace with actual API call
        // await sftpService.createDestination(sftpFormData);
        toast.success("SFTP destination created successfully!");
        // Reset form
        setSftpFormData({
          destinationName: "",
          description: "",
          host: "",
          port: "",
          username: "",
          password: "",
          remotePath: "",
          fileName: "",
          fileFormat: "",
          schedule: "",
          enabled: true,
        });
        setSftpStep(1);
      } catch (error) {
        console.error("Error creating SFTP destination:", error);
        toast.error("Failed to create SFTP destination");
      } finally {
        setSftpSubmitting(false);
      }
    }
  };

  const renderSftpStep = () => {
    switch (sftpStep) {
      case 1:
        return (
          <div>
            <h5 className="mb-4 fw-600">Basic Information</h5>
            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                Destination Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="destinationName"
                value={sftpFormData.destinationName}
                onChange={handleSftpInputChange}
                placeholder="Enter destination name"
                isInvalid={!!sftpFormErrors.destinationName}
              />
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.destinationName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-12">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={sftpFormData.description}
                onChange={handleSftpInputChange}
                placeholder="Enter description (optional)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                Host <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="host"
                value={sftpFormData.host}
                onChange={handleSftpInputChange}
                placeholder="Enter SFTP host"
                isInvalid={!!sftpFormErrors.host}
              />
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.host}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                Port <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="port"
                value={sftpFormData.port}
                onChange={handleSftpInputChange}
                placeholder="Enter port (default: 22)"
                isInvalid={!!sftpFormErrors.port}
              />
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.port}
              </Form.Control.Feedback>
            </Form.Group>
          </div>
        );

      case 2:
        return (
          <div>
            <h5 className="mb-4 fw-600">Connection Details</h5>
            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                Username <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={sftpFormData.username}
                onChange={handleSftpInputChange}
                placeholder="Enter username"
                isInvalid={!!sftpFormErrors.username}
              />
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                Password <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={sftpFormData.password}
                onChange={handleSftpInputChange}
                placeholder="Enter password"
                isInvalid={!!sftpFormErrors.password}
              />
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                Remote Path <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="remotePath"
                value={sftpFormData.remotePath}
                onChange={handleSftpInputChange}
                placeholder="Enter remote path (e.g., /uploads)"
                isInvalid={!!sftpFormErrors.remotePath}
              />
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.remotePath}
              </Form.Control.Feedback>
            </Form.Group>
          </div>
        );

      case 3:
        return (
          <div>
            <h5 className="mb-4 fw-600">File Configuration</h5>
            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                File Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="fileName"
                value={sftpFormData.fileName}
                onChange={handleSftpInputChange}
                placeholder="Enter file name pattern"
                isInvalid={!!sftpFormErrors.fileName}
              />
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.fileName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-12">
                File Format <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="fileFormat"
                value={sftpFormData.fileFormat}
                onChange={handleSftpInputChange}
                isInvalid={!!sftpFormErrors.fileFormat}
              >
                <option value="">Select file format</option>
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
                <option value="XML">XML</option>
                <option value="TXT">TXT</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {sftpFormErrors.fileFormat}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fs-12">Schedule</Form.Label>
              <Form.Select
                name="schedule"
                value={sftpFormData.schedule}
                onChange={handleSftpInputChange}
              >
                <option value="">Select schedule</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="MANUAL">Manual</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="enabled"
                label="Enable this destination"
                checked={sftpFormData.enabled}
                onChange={handleSftpInputChange}
              />
            </Form.Group>
          </div>
        );

      case 4:
        return (
          <div>
            <h5 className="mb-4 fw-600">Overview</h5>
            <Card className="br-radius-12 card-nostyle" style={{ border: "1px solid #EAECEE" }}>
              <Card.Body>
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">Destination Name</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.destinationName || "N/A"}</p>
                  </Col>
                </Row>
                {sftpFormData.description && (
                  <Row className="mb-3">
                    <Col sm={4} className="text-start">
                      <h6 className="mb-0 text-616161 fw-400 fs-12">Description</h6>
                    </Col>
                    <Col sm={8} className="text-start">
                      <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.description}</p>
                    </Col>
                  </Row>
                )}
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">Host</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.host || "N/A"}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">Port</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.port || "N/A"}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">Username</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.username || "N/A"}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">Remote Path</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.remotePath || "N/A"}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">File Name</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.fileName || "N/A"}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">File Format</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.fileFormat || "N/A"}</p>
                  </Col>
                </Row>
                {sftpFormData.schedule && (
                  <Row className="mb-3">
                    <Col sm={4} className="text-start">
                      <h6 className="mb-0 text-616161 fw-400 fs-12">Schedule</h6>
                    </Col>
                    <Col sm={8} className="text-start">
                      <p className="mb-0 fs-14 text-dark fw-600">{sftpFormData.schedule}</p>
                    </Col>
                  </Row>
                )}
                <Row className="mb-3">
                  <Col sm={4} className="text-start">
                    <h6 className="mb-0 text-616161 fw-400 fs-12">Status</h6>
                  </Col>
                  <Col sm={8} className="text-start">
                    <p className="mb-0 fs-14 text-dark fw-600">
                      {sftpFormData.enabled ? "Enabled" : "Disabled"}
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

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
                            <Card.Header className="bg-white border-0 br-radius-12 rounded-bottom-0 fs-20 d-flex p-0 card-header">
                            </Card.Header>
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
                    <div className="main-container p-0">
                      <Row>
                        <Col lg={12}>
                          <Card className="br-radius-0 card-nostyle">
                            <Card.Header className="bg-white border-0 br-radius-12 rounded-bottom-0 fs-20 d-flex p-0">
                            </Card.Header>
                            <Card.Body className="p-0">
                              <div className="mb-4">
                                <div className="d-flex align-items-center gap-2">
                                  <Dropdown>
                                    <Dropdown.Toggle
                                      variant="white"
                                      className="d-flex cus-dropdown-toggle-show align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: `1px solid ${creditHistoryFilterOpen ? "#28a745" : "#EAECEE"}`,
                                      }}
                                    >
                                      <IoFilterOutline className="me-2" />
                                      <span className="fw-400 fs-12">Filter</span>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="p-3 mt-2" style={{ width: "400px" }}>
                                      {userRole === "SUPERADMIN" && (
                                        <Form.Group className="mb-3">
                                          <Form.Label className="fs-12">Account Name</Form.Label>
                                          <Form.Select
                                            value={creditHistoryAccountId}
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
                                        <Form.Label className="fs-12">Transaction Type</Form.Label>
                                        <Form.Select
                                          value={creditHistoryFilters.transactionType}
                                          onChange={(e) =>
                                            handleCreditHistoryFilterChange("transactionType", e.target.value)
                                          }
                                          className="br-radius-8"
                                        >
                                          <option value="">Select Type</option>
                                          <option value="CREDIT">Credit</option>
                                          <option value="DEBIT">Debit</option>
                                        </Form.Select>
                                      </Form.Group>

                                      <Form.Group className="mb-3">
                                        <Form.Label className="fs-12">Credit Type</Form.Label>
                                        <Form.Select
                                          value={creditHistoryFilters.creditType}
                                          onChange={(e) =>
                                            handleCreditHistoryFilterChange("creditType", e.target.value)
                                          }
                                          className=""
                                        >
                                          <option value="">Select Credit Type</option>
                                          <option value="SHORTENING">Shortening</option>
                                          <option value="TRACKING">Tracking</option>
                                        </Form.Select>
                                      </Form.Group>

                                      <Form.Group className="mb-3">
                                        <Form.Label className="fs-12">Date Range <span className="text-danger">*</span></Form.Label>
                                        <div
                                          className="d-flex align-items-center justify-content-between"
                                          style={{
                                            border: "1px solid #EAECEE",
                                            borderRadius: "8px",
                                          }}
                                        >
                                          <DatePicker
                                            selected={creditHistoryStartDate}
                                            onChange={(date) => handleCreditHistoryDateChange(date, true)}
                                            className="form-control border-0 br-radius-32 me-2 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                            placeholderText="Start Date"
                                            maxDate={creditHistoryEndDate || new Date()}
                                            minDate={userCreatedAt}
                                            dateFormat="MMM dd, yyyy"
                                          />

                                          <span className="mx-2">⇆</span>

                                          <DatePicker
                                            selected={creditHistoryEndDate}
                                            onChange={(date) => handleCreditHistoryDateChange(date, false)}
                                            className="form-control border-0 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                            placeholderText="End Date"
                                            minDate={creditHistoryStartDate}
                                            maxDate={new Date()}
                                            dateFormat="MMM dd, yyyy"
                                          />

                                          <FaCalendarAlt
                                            className={`me-2 ${
                                              creditHistoryStartDate || creditHistoryEndDate
                                                ? "text-danger"
                                                : ""
                                            }`}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                              setCreditHistoryStartDate(null);
                                              setCreditHistoryEndDate(null);
                                            }}
                                          />
                                        </div>
                                      </Form.Group>

                                      <div className="d-flex justify-content-center gap-2 mt-3">
                                        <Button
                                          variant="light"
                                          size="sm"
                                          onClick={() => {
                                            setCreditHistoryFilters({
                                              transactionType: "",
                                              creditType: "",
                                            });
                                            setCreditHistoryStartDate(null);
                                            setCreditHistoryEndDate(null);
                                            if (userRole === "SUPERADMIN") {
                                              setCreditHistoryAccountId("");
                                            }
                                            setCreditHistory([]);
                                          }}
                                        >
                                          Clear all
                                        </Button>
                                        <Button
                                          variant="success"
                                          size="sm"
                                          onClick={handleCreditHistorySearch}
                                          disabled={
                                            creditHistoryLoading || 
                                            !creditHistoryStartDate || 
                                            !creditHistoryEndDate || 
                                            (userRole === "SUPERADMIN" && !creditHistoryAccountId)
                                          }
                                          className="br-radius-8"
                                        >
                                          {creditHistoryLoading ? (
                                            <>
                                              <Spinner size="sm" className="me-1" />
                                              Applying...
                                            </>
                                          ) : (
                                            "Apply"
                                          )}
                                        </Button>
                                      </div>
                                    </Dropdown.Menu>
                                  </Dropdown>

                                  {activeTab === "creditHistory" && 
                                    ((userRole === "SUPERADMIN" && creditHistoryAccountId) || 
                                    Object.values(creditHistoryFilters).some(value => value) || 
                                    creditHistoryStartDate || 
                                    creditHistoryEndDate) && (
                                    <Button
                                      variant="light"
                                      size="sm"
                                      className="d-flex align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: "1px solid #EAECEE",
                                        padding: "9px 15px",
                                      }}
                                      onClick={() => {
                                        setCreditHistoryFilters({
                                          transactionType: "",
                                          creditType: "",
                                        });
                                        setCreditHistoryStartDate(null);
                                        setCreditHistoryEndDate(null);
                                        if (userRole === "SUPERADMIN") {
                                          setCreditHistoryAccountId("");
                                        }
                                        setCreditHistory([]);
                                      }}
                                    >
                                      <FcClearFilters size={12} />
                                      <span className="fw-400 fs-12">Clear All</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {creditHistoryLoading ? (
                                <div className="text-center py-4">
                                  <Spinner animation="border" variant="success" />
                                  <p className="mt-3 text-muted">Loading credit history...</p>
                                </div>
                              ) : creditHistory.length > 0 ? (
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
                                      <p className="mb-0 fs-14 text-dark fw-600">{creditHistory.length}</p>
                                    </Col>
                                  </Row>
                                  <Row className="mb-2 align-items-center">
                                    <Col sm={6} className="text-start">
                                      <h6 className="mb-0 text-616161 fw-400 fs-12">Date Range</h6>
                                    </Col>
                                    <Col sm={6} className="text-start">
                                      <p className="mb-0 fs-14 text-dark fw-600">
                                        {creditHistoryStartDate ? creditHistoryStartDate.toLocaleDateString() : "N/A"} to{" "}
                                        {creditHistoryEndDate ? creditHistoryEndDate.toLocaleDateString() : "N/A"}
                                      </p>
                                    </Col>
                                  </Row>

                                  {((userRole === "SUPERADMIN" && creditHistoryAccountId) || 
                                    Object.values(creditHistoryFilters).some(value => value)) && (
                                    <hr className="my-3" style={{ borderColor: "#EAECEE" }} />
                                  )}

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
                                        <Col sm={8} className="text-start">
                                          <p className="mb-0 fs-14 text-dark fw-600">{value}</p>
                                        </Col>
                                      </Row>
                                    )
                                  )}

                                  <div className="mt-4">
                                    <Button
                                      variant="success br-radius-8"
                                      onClick={handleCreditHistoryDownload}
                                      disabled={isCreditHistoryDownloading}
                                      className="GeneralSansMedium"
                                      style={{ whiteSpace: "nowrap" }}
                                    >
                                      {isCreditHistoryDownloading ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                          Downloading...
                                        </>
                                      ) : (
                                        "Download CSV"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <Image src={noRecordFound} width={100} className="mb-3" />
                                  <h5 className="mb-1 fs-14 fw-600">No Records Found</h5>
                                  <p className="text-muted">No credit history records match your search criteria</p>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="creditConsumption" title="Credit Consumption">
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
                                    show={creditConsumptionFilterOpen}
                                    onToggle={(isOpen) => setCreditConsumptionFilterOpen(isOpen)}
                                  >
                                    <Dropdown.Toggle
                                      variant="white"
                                      className="d-flex cus-dropdown-toggle-show align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: `1px solid ${creditConsumptionFilterOpen ? "#28a745" : "#EAECEE"}`,
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
                                              value={creditConsumptionAccountId}
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
                                            Transaction Type
                                          </Form.Label>
                                          <Form.Control
                                            type="text"
                                            value="DEBIT"
                                            disabled
                                            className=""
                                          />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                          <Form.Label className="fs-12">
                                            Credit Type
                                          </Form.Label>
                                          <Form.Select
                                            value={
                                              creditConsumptionFilters.creditType
                                            }
                                            onChange={(e) =>
                                              handleCreditConsumptionFilterChange(
                                                "creditType",
                                                e.target.value
                                              )
                                            }
                                            className=""
                                          >
                                            <option value="">
                                              Select Credit Type
                                            </option>
                                            <option value="SHORTENING">
                                              Shortening
                                            </option>
                                            <option value="TRACKING">
                                              Tracking
                                            </option>
                                          </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                          <Form.Label className="fs-12">
                                            Date Range <span className="text-danger">*</span>
                                          </Form.Label>
                                          <div
                                            className="d-flex align-items-center justify-content-between"
                                            style={{
                                              border: "1px solid #EAECEE",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <DatePicker
                                              selected={
                                                creditConsumptionStartDate
                                              }
                                              onChange={(date) =>
                                                handleCreditConsumptionDateChange(
                                                  date,
                                                  true
                                                )
                                              }
                                              className="form-control border-0 br-radius-32 me-2 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                              placeholderText="Start Date"
                                              maxDate={
                                                creditConsumptionEndDate ||
                                                new Date()
                                              }
                                              minDate={userCreatedAt}
                                              dateFormat="MMM dd, yyyy"
                                            />

                                            <span className="mx-2">⇆</span>

                                            <DatePicker
                                              selected={
                                                creditConsumptionEndDate
                                              }
                                              onChange={(date) =>
                                                handleCreditConsumptionDateChange(
                                                  date,
                                                  false
                                                )
                                              }
                                              className="form-control border-0 search-fields mr-sm-2 GeneralSansMedium fw-500"
                                              placeholderText="End Date"
                                              minDate={
                                                creditConsumptionStartDate
                                              }
                                              maxDate={new Date()}
                                              dateFormat="MMM dd, yyyy"
                                            />

                                            <FaCalendarAlt
                                              className={`me-2 ${
                                                creditConsumptionStartDate ||
                                                creditConsumptionEndDate
                                                  ? "text-danger"
                                                  : ""
                                              }`}
                                              style={{ cursor: "pointer" }}
                                              onClick={() => {
                                                setCreditConsumptionStartDate(
                                                  null
                                                );
                                                setCreditConsumptionEndDate(
                                                  null
                                                );
                                              }}
                                            />
                                          </div>
                                        </Form.Group>

                                        <div className="d-flex justify-content-center gap-2 mt-3">
                                          <Button
                                            variant="light"
                                            size="sm"
                                            onClick={() => {
                                              setCreditConsumptionFilters({
                                                transactionType: "DEBIT",
                                                creditType: "",
                                              });
                                              setCreditConsumptionStartDate(
                                                null
                                              );
                                              setCreditConsumptionEndDate(null);
                                              if (userRole === "SUPERADMIN") {
                                                setCreditConsumptionAccountId("");
                                              }
                                              setCreditConsumption([]);
                                            }}
                                            className=""
                                          >
                                            Clear all
                                          </Button>
                                          <Button
                                            variant="success"
                                            size="sm"
                                            onClick={handleCreditConsumptionSearch}
                                            disabled={
                                              creditConsumptionLoading || 
                                              !creditConsumptionStartDate || 
                                              !creditConsumptionEndDate || 
                                              (userRole === "SUPERADMIN" && !creditConsumptionAccountId)
                                            }
                                            className="br-radius-8"
                                          >
                                            {creditConsumptionLoading ? (
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

                                  {activeTab === "creditConsumption" && ((userRole === "SUPERADMIN" && creditConsumptionAccountId) || 
                                    Object.values(creditConsumptionFilters).some(value => value) || 
                                    creditConsumptionStartDate || 
                                    creditConsumptionEndDate) && (
                                    <Button
                                      variant="light"
                                      size="sm"
                                      className="d-flex align-items-center gap-2 br-radius-8"
                                      style={{
                                        border: "1px solid #EAECEE",
                                        padding: "9px 15px",
                                      }}
                                      onClick={() => {
                                        setCreditConsumptionFilters({
                                          transactionType: "DEBIT",
                                          creditType: "",
                                        });
                                        setCreditConsumptionStartDate(
                                          null
                                        );
                                        setCreditConsumptionEndDate(null);
                                        if (userRole === "SUPERADMIN") {
                                          setCreditConsumptionAccountId("");
                                        }
                                        setCreditConsumption([]);
                                      }}
                                    >
                                      <FcClearFilters size={12} />
                                      <span className="fw-400 fs-12">Clear All</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {creditConsumptionLoading ? (
                                <div className="text-center py-4">
                                  <Spinner
                                    animation="border"
                                    variant="success"
                                  />
                                  <p className="mt-3 text-muted">
                                    Loading credit consumption...
                                  </p>
                                </div>
                              ) : creditConsumption.length > 0 ? (
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
                                        {creditConsumption.length}
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
                                        {creditConsumptionStartDate
                                          ? creditConsumptionStartDate.toLocaleDateString()
                                          : "N/A"}{" "}
                                        to{" "}
                                        {creditConsumptionEndDate
                                          ? creditConsumptionEndDate.toLocaleDateString()
                                          : "N/A"}
                                      </p>
                                    </Col>
                                  </Row>

                                  {((userRole === "SUPERADMIN" && creditConsumptionAccountId) || 
                                    Object.values(creditConsumptionFilters).some(value => value) || 
                                    creditConsumptionStartDate || 
                                    creditConsumptionEndDate) && (
                                    <hr className="my-3" style={{ borderColor: "#EAECEE" }} />
                                  )}

                                  {renderSearchTerms()}

                                  <div className="mt-4">
                                    {creditConsumption.length > 0 && (
                                      <Button
                                        variant="success br-radius-8"
                                        onClick={
                                          handleCreditConsumptionDownload
                                        }
                                        disabled={
                                          isCreditConsumptionDownloading
                                        }
                                        className="GeneralSansMedium"
                                        style={{ whiteSpace: "nowrap" }}
                                      >
                                        {isCreditConsumptionDownloading ? (
                                          <>
                                            <span
                                              className="spinner-border spinner-border-sm me-2"
                                              role="status"
                                              aria-hidden="true"
                                            ></span>
                                            Downloading...
                                          </>
                                        ) : (
                                          "Download CSV"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <Image
                                    src={noRecordFound}
                                    width={100}
                                    className="mb-3"
                                  />
                                  <h5 className="mb-1 fs-14 fw-600">
                                    No Records Found
                                  </h5>
                                  <p className="text-muted">
                                    No credit consumption records match your
                                    search criteria
                                  </p>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="sftpDestination" title="SFTP Destination">
                    <div className="main-container p-0">
                      <Row>
                        <Col lg={12}>
                          <Card className="br-radius-0 card-nostyle">
                            <Card.Header className="bg-white border-0 br-radius-12 rounded-bottom-0 fs-20 d-flex p-0">
                            </Card.Header>
                            <Card.Body className="p-4">
                              <div className="mb-4">
                                <ProgressBar 
                                  now={(sftpStep / 4) * 100} 
                                  variant="success" 
                                  className="br-radius-8"
                                  style={{ height: "8px" }}
                                />
                                <div className="d-flex justify-content-between mt-2">
                                  <span className={`fs-12 ${sftpStep >= 1 ? 'text-success fw-600' : 'text-muted'}`}>
                                    Step 1: Basic Info
                                  </span>
                                  <span className={`fs-12 ${sftpStep >= 2 ? 'text-success fw-600' : 'text-muted'}`}>
                                    Step 2: Connection
                                  </span>
                                  <span className={`fs-12 ${sftpStep >= 3 ? 'text-success fw-600' : 'text-muted'}`}>
                                    Step 3: File Config
                                  </span>
                                  <span className={`fs-12 ${sftpStep >= 4 ? 'text-success fw-600' : 'text-muted'}`}>
                                    Step 4: Overview
                                  </span>
                                </div>
                              </div>

                              <Card className="br-radius-12 card-nostyle" style={{ border: "1px solid #EAECEE" }}>
                                <Card.Body className="p-4">
                                  {renderSftpStep()}
                                </Card.Body>
                              </Card>

                              <div className="d-flex justify-content-between mt-4">
                                <Button
                                  variant="light"
                                  onClick={handleSftpPrevious}
                                  disabled={sftpStep === 1}
                                  className="d-flex align-items-center gap-2 br-radius-8"
                                  style={{
                                    border: "1px solid #EAECEE",
                                    padding: "9px 15px",
                                  }}
                                >
                                  <FaChevronLeft size={12} />
                                  <span className="fw-400 fs-12">Previous</span>
                                </Button>

                                {sftpStep < 4 ? (
                                  <Button
                                    variant="success"
                                    onClick={handleSftpNext}
                                    className="d-flex align-items-center gap-2 br-radius-8"
                                    style={{ padding: "9px 15px" }}
                                  >
                                    <span className="fw-400 fs-12">Next</span>
                                    <FaChevronRight size={12} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="success"
                                    onClick={handleSftpSubmit}
                                    disabled={sftpSubmitting}
                                    className="d-flex align-items-center gap-2 br-radius-8"
                                    style={{ padding: "9px 15px" }}
                                  >
                                    {sftpSubmitting ? (
                                      <>
                                        <Spinner size="sm" className="me-2" />
                                        <span className="fw-400 fs-12">Submitting...</span>
                                      </>
                                    ) : (
                                      <span className="fw-400 fs-12">Submit</span>
                                    )}
                                  </Button>
                                )}
                              </div>
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