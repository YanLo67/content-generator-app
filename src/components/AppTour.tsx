import Joyride, { EVENTS, STATUS } from "react-joyride";
import type { Step, CallBackProps } from "react-joyride";
import { useNavigate } from "react-router-dom";

interface AppTourProps {
  run: boolean;
  onTourEnd: () => void;
}

const TOUR_STEPS: Step[] = [
  {
    target: "#tour-step-1",
    content:
      "Voici l'onglet 'Création', votre centre de commande principal pour générer de nouvelles idées de posts.",
    title: "Page Création",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-step-2",
    content:
      "C'est ici que toutes vos idées apparaîtront. Vous pouvez les filtrer par statut (Vert, Orange, Rouge) ou les rechercher.",
    title: "Grille des Idées",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-step-3",
    content:
      "Utilisez cette zone pour générer du contenu. Vous pouvez écrire une idée  ou même uploader un document.",
    title: "L'Assistant de Contenu",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: "#tour-step-4",
    content:
      "La page 'Posts' vous permet de gérer tout votre contenu sous forme de tableau Kanban (Idée, À faire, En cours, A publié, Publié).",
    title: "Page Posts (Kanban)",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-step-5",
    content:
      "Bienvenue sur la page 'Calendrier', où vous pouvez planifier visuellement toutes vos publications.",
    title: "Page Calendrier",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-step-6",
    content:
      "Cette barre latérale contient tous vos posts qui sont prêts à être planifiés. Il suffit de les glisser-déposer sur le calendrier.",
    title: "Posts à Planifier",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-step-7",
    content:
      "Voici votre calendrier éditorial. Vous pouvez naviguer entre les vues 'Mois' et 'Semaine' et voir tous vos posts programmés.",
    title: "Votre Calendrier",
    placement: "left",
    disableBeacon: true,
  },
  {
    target: "#tour-step-8",
    content:
      "Enfin, la page 'Profil'. Un persona marketing complet a été généré par l'IA en fonction de vos informations. N'hésitez pas à le personnaliser !",
    title: "Votre Profil (Persona)",
    placement: "right",
    disableBeacon: true,
  },
];

export default function AppTour({ run, onTourEnd }: AppTourProps) {
  const navigate = useNavigate();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;

    // Si on a fini ou skippé le tour
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      onTourEnd();
    }
    // Si on vient de terminer une étape
    else if (type === EVENTS.STEP_AFTER) {
      if (index === 2) {
        navigate("/user/posts");
      }
      if (index === 3) {
        navigate("/user/calendar");
      }
      if (index === 6) {
        navigate("/user/profile");
      }
    }
  };

  return (
    <Joyride
      // On retire stepIndex pour laisser la bibliothèque gérer
      steps={TOUR_STEPS}
      run={run}
      continuous
      scrollToFirstStep // S'assure que la cible est visible
      showProgress
      showSkipButton
      disableScrolling={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#0ea5e9",
          textColor: "#334155",
        },
      }}
      locale={{
        next: "Suivant",
        back: "Précédent",
        skip: "Passer",
        last: "Terminer",
      }}
    />
  );
}
