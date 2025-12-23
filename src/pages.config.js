import ActNow from './pages/ActNow';
import Automation from './pages/Automation';
import Home from './pages/Home';
import ImportLeads from './pages/ImportLeads';
import LeadDetails from './pages/LeadDetails';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import Reports from './pages/Reports';
import SalesGalaxy from './pages/SalesGalaxy';
import SearchResults from './pages/SearchResults';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActNow": ActNow,
    "Automation": Automation,
    "Home": Home,
    "ImportLeads": ImportLeads,
    "LeadDetails": LeadDetails,
    "Leads": Leads,
    "Opportunities": Opportunities,
    "Reports": Reports,
    "SalesGalaxy": SalesGalaxy,
    "SearchResults": SearchResults,
    "Settings": Settings,
    "Tasks": Tasks,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};