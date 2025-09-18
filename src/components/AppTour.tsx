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
    content: "C'est ici que vous commencerez...",
    title: "La page Création",
    placement: "auto",
    disableBeacon: true,
  },
  {
    target: "#tour-step-2",
    content: "Le contenu de chaque page s'affichera ici.",
    title: "Votre espace de travail",
    placement: "auto",
  },
  {
    target: "#tour-step-3",
    content:
      "Une fois vos idées créées, vous les retrouverez sur la page suivante.",
    title: "Vos Idées",
    placement: "auto",
  },
  {
    target: "#tour-step-4",
    content:
      "Une fois vos idées créées, vous les retrouverez sur la page suivante.",
    title: "Vos Idées",
    placement: "auto",
  },
  {
    target: "#tour-step-5", // Doit être sur la page /user/posts
    content: "C'est ici que tous vos posts sont listés.",
    title: "Gestion des Posts",
    placement: "auto",
  },
  {
    target: "#tour-step-6", // Doit être sur la page /user/calendar
    content: "C'est ici que tous vos posts sont listés.",
    title: "Gestion des Posts",
    placement: "auto",
  },
  {
    target: "#tour-step-7", // Doit être sur la page /user/calendar
    content: "C'est ici que tous vos posts sont listés.",
    title: "Gestion des Posts",
    placement: "auto",
  },
  {
    target: "#tour-step-8", // Doit être sur la page /user/calendar
    content: "C'est ici que tous vos posts sont listés.",
    title: "Gestion des Posts",
    placement: "auto",
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
