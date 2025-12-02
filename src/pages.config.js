import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import Automation from './pages/Automation';
import LeadDetails from './pages/LeadDetails';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "Opportunities": Opportunities,
    "Automation": Automation,
    "LeadDetails": LeadDetails,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};