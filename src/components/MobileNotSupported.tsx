import { FiMonitor, FiSmartphone } from "react-icons/fi";

export default function MobileNotSupported() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6 text-center">
      <div className="flex items-center gap-4 mb-8">
        <FiMonitor size={48} className="text-blue-400" />
        <FiSmartphone size={32} className="text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold mb-3 text-white">
        Version Desktop Requise
      </h1>
      <p className="max-w-md text-gray-300">
        Pour garantir la meilleure expérience, cette application est
        actuellement optimisée pour les écrans d'ordinateur.
      </p>
      <p className="mt-2 text-gray-400">
        Veuillez consulter le site depuis votre ordinateur.
      </p>
    </div>
  );
}
