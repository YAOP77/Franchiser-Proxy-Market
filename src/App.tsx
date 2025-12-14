/**
 * Composant App - Point d'entrée principal de l'application
 * 
 * Ce composant configure le routage de l'application Proxy Market Dashboard.
 * Il utilise React Router pour gérer la navigation entre les différentes pages.
 * 
 * Structure des routes :
 * - Routes avec layout (AppLayout) : Dashboard, Profil, Calendrier, etc.
 * - Routes d'authentification : Connexion, Inscription
 * - Route 404 : Page non trouvée
 */

import { BrowserRouter as Router, Routes, Route } from "react-router";

// Layout et utilitaires
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext";

// Pages avec layout
import Home from "./pages/Dashboard/Home";
import Statistics from "./pages/Dashboard/Statistics";
import MesProduitsPage from "./pages/Products/MesProduitsPage";
import MonStorePage from "./pages/Store/MonStorePage";
import OrdersList from "./pages/Orders/OrdersList";
import OrderDetails from "./pages/Orders/OrderDetails";
import AddDeliveryPerson from "./pages/Delivery/AddDeliveryPerson";
import DeliveryPersonsList from "./pages/Delivery/DeliveryPersonsList";
import DeliveryPersonsSearch from "./pages/Delivery/DeliveryPersonsSearch";
import DeliveryPersonDetails from "./pages/Delivery/DeliveryPersonDetails";
import UserProfiles from "./pages/UserProfiles";

// Pages d'authentification
import SignIn from "./pages/AuthPages/SignIn";
// import SignUp from "./pages/AuthPages/SignUp"; // Masqué - redirige vers 404

// Page 404
import NotFound from "./pages/OtherPage/NotFound";

export default function App() {
  return (
    <GoogleMapsProvider>
      <Router>
        {/* Scroll automatique vers le haut lors du changement de route */}
        <ScrollToTop />
        
        <Routes>
          {/* Routes d'authentification (sans layout, accessibles uniquement si non authentifié) */}
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          {/* Route Inscription masquée - redirige vers 404 */}
          <Route path="/signup" element={<NotFound />} />

          {/* Routes protégées avec layout principal (sidebar + header) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="/statistics" element={<Statistics />} />

            {/* Pages boutique */}
            <Route path="/produits" element={<MesProduitsPage />} />
            <Route path="/mon-store" element={<MonStorePage />} />
            <Route path="/commandes" element={<OrdersList />} />
            <Route path="/order/:orderId" element={<OrderDetails />} />
            <Route path="/creer-livreur" element={<AddDeliveryPerson />} />
            <Route path="/livreurs" element={<DeliveryPersonsList />} />
            <Route path="/livreurs/search" element={<DeliveryPersonsSearch />} />
            <Route path="/livreur/:deliveryPersonId" element={<DeliveryPersonDetails />} />
            
            {/* Page profil */}
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Route 404 - Page non trouvée */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </GoogleMapsProvider>
  );
}
