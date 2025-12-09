/**
 * Composant PageMeta - Gestion des métadonnées des pages
 * 
 * Ce composant utilise react-helmet-async pour gérer dynamiquement
 * le titre et la description des pages pour le SEO.
 */

import { HelmetProvider, Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
}

/**
 * Composant pour définir les métadonnées d'une page
 * @param title - Titre de la page (apparaît dans l'onglet du navigateur)
 * @param description - Description de la page (pour le SEO)
 */
const PageMeta: React.FC<PageMetaProps> = ({ title, description }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Helmet>
);

/**
 * Wrapper pour fournir le contexte HelmetProvider à toute l'application
 * @param children - Composants enfants à envelopper
 */
export const AppWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <HelmetProvider>{children}</HelmetProvider>;

export default PageMeta;
