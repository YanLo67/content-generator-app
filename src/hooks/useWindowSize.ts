import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{ width: number | undefined }>({
    width: undefined,
  });

  useEffect(() => {
    // La fonction qui met à jour l'état avec la largeur de la fenêtre
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
      });
    }
    
    // On ajoute un écouteur d'événement au montage du composant
    window.addEventListener("resize", handleResize);
    
    // On appelle la fonction une fois au début pour avoir la taille initiale
    handleResize();
    
    // On nettoie l'écouteur d'événement au démontage du composant
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Le tableau vide assure que cet effet ne se lance qu'une fois

  return windowSize;
}