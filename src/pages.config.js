import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Automation from './pages/Automation';
import LeadDetails from './pages/LeadDetails';
import ImportLeads from './pages/ImportLeads';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Opportunities from './pages/Opportunities';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "Automation": Automation,
    "LeadDetails": LeadDetails,
    "ImportLeads": ImportLeads,
    "Reports": Reports,
    "Settings": Settings,
    "Opportunities": Opportunities,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};