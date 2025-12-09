import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [isWarningAlertVisible, setIsWarningAlertVisible] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Gère l'affichage et la disparition de l'alerte d'avertissement avec transition
   */
  useEffect(() => {
    if (showWarningAlert) {
      // Afficher l'alerte avec transition
      setIsWarningAlertVisible(true);
      
      // Commencer la transition de sortie après 2.5 secondes
      const fadeOutTimer = setTimeout(() => {
        setIsWarningAlertVisible(false);
      }, 2500);
      
      // Masquer complètement l'alerte après la transition (3 secondes total)
      const hideTimer = setTimeout(() => {
        setShowWarningAlert(false);
      }, 3000);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      // Réinitialiser l'état de visibilité si l'alerte est masquée manuellement
      setIsWarningAlertVisible(false);
    }
  }, [showWarningAlert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);
    
    // Vérifier si les champs requis sont remplis
    if (!email.trim() || !password.trim()) {
      setShowWarningAlert(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Rediriger vers la page d'origine ou le dashboard
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        // Afficher l'erreur retournée par l'API
        setError(result.error || "Email ou mot de passe incorrect");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 relative">
      {/* Logo Proxy Market - En haut à gauche (fixed pour être vraiment en haut) */}
      <div className="fixed -top-2 sm:-top-1 md:top-0 lg:top-2 left-10 sm:left-14 md:left-18 lg:left-24 z-50">
        <img 
          src="/Logo-Proxy-Market.png" 
          alt="Proxy Market Logo" 
          className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto"
        />
      </div>
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Connexion
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Entrez votre email et mot de passe pour vous connecter !
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    {error}
            </div>
                )}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input 
                    placeholder="info@gmail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                </div>
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Link
                    to="/reset-password"
                    className="text-sm text-[#04b05d] hover:text-[#039850] dark:text-[#04b05d]"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div>
                  <Button 
                    className="w-full !bg-[#04b05d] hover:!bg-[#039850] !text-white" 
                    size="sm"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Alerte d'avertissement pour les champs requis */}
            {showWarningAlert && (
              <div 
                className={`mt-6 transition-all duration-500 ease-in-out ${
                  isWarningAlertVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <Alert
                  variant="warning"
                  title="Champs requis"
                  message="Tous les champs sont requis"
                  showLink={false}
                />
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
