import ActNow from './pages/ActNow';
import Automation from './pages/Automation';
import Home from './pages/Home';
import ImportLeads from './pages/ImportLeads';
import LeadDetails from './pages/LeadDetails';
import Promotion from './pages/Promotion';
import Reports from './pages/Reports';
import SearchResults from './pages/SearchResults';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import Opportunities from './pages/Opportunities';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActNow": ActNow,
    "Automation": Automation,
    "Home": Home,
    "ImportLeads": ImportLeads,
    "LeadDetails": LeadDetails,
    "Promotion": Promotion,
    "Reports": Reports,
    "SearchResults": SearchResults,
    "Settings": Settings,
    "Tasks": Tasks,
    "Opportunities": Opportunities,
    "Dashboard": Dashboard,
    "Leads": Leads,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};