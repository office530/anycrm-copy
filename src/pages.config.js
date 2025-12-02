import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import Automation from './pages/Automation';
import LeadDetails from './pages/LeadDetails';
import ImportLeads from './pages/ImportLeads';
import Reports from './pages/Reports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "Opportunities": Opportunities,
    "Automation": Automation,
    "LeadDetails": LeadDetails,
    "ImportLeads": ImportLeads,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};