import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "Opportunities": Opportunities,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};