import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import Automation from './pages/Automation';
import LeadDetails from './pages/LeadDetails';
import ImportLeads from './pages/ImportLeads';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SearchResults from './pages/SearchResults';
import Tasks from './pages/Tasks';
import Promotion from './pages/Promotion';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "Opportunities": Opportunities,
    "Automation": Automation,
    "LeadDetails": LeadDetails,
    "ImportLeads": ImportLeads,
    "Reports": Reports,
    "Settings": Settings,
    "SearchResults": SearchResults,
    "Tasks": Tasks,
    "Promotion": Promotion,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};