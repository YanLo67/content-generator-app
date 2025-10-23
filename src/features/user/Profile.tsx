import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import ProfileField from "../../components/ProfileField";
import Section from "../../components/Section";
import GeneralProfileInfo from "../../components/GeneralProfileInfo";

// L'interface Persona complète (inchangée)
interface Persona {
  user_profile: {
    who: string;
    values: string[];
    dream: string;
    goal: string;
    unpopular_opinion: string;
    belief: string;
    mission: string;
    company: string;
    industry: string;
    product: string;
    value_prop: string;
    features: string[];
    benefits: string[];
    usp: string;
    topics: string[];
    perspective: string;
    ideology: string;
    stories: string[];
    life_milestones: string[];
    challenges_overcome: string[];
    advocacies: string[];
  };
  target_audience: {
    problems: string[];
    pain_if_unsolved: string;
    frustration: string;
    secret_pain: string;
    fears: string[];
    required_opinion: string;
    obstacles: string[];
    belief: string;
    limiting_belief: string;
    common_enemy: string;
    strong_opinion: string;
    desired_result: string;
    dream_to_achieve: string;
    dream_beyond_problems: string;
    ideal_world_vision: string;
    values: string[];
    icp_triggers: string[];
    action_triggers: string[];
    purchase_triggers: string[];
  };
  detailed_persona: {
    verbatim: string;
    sector_perception: string;
    decision_process: string;
    future_aspirations: string;
    emotional_reactions: string;
    content_preferences: string;
  };
}

export default function Profile() {
  const { user } = useAuth();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"userProfile" | "targetAudience">(
    "userProfile"
  );

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        if (data) {
          setProfileData(data); // On stocke toutes les infos
          if (data.persona_data) {
            setPersona(data.persona_data); // On stocke le persona séparément
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const handleStyleChange = (newStyle: string) => {
    console.log(newStyle);
    setProfileData((prev: any) => ({
      ...prev,
      default_writing_style: newStyle,
    }));
  };

  const handleCustomStyleSave = async (newDescription: string) => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ custom_writing_style: newDescription })
        .eq("id", user.id);
      setProfileData((prev: any) => ({
        ...prev,
        custom_writing_style: newDescription,
        default_writing_style: newDescription, // On le sélectionne par défaut
      }));
    } catch (error) {
      alert("Erreur de sauvegarde du style personnalisé.");
      console.error(error);
    }
  };

  // La fonction handleChange reste inchangée
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const [section, key] = name.split(".");

    const isArrayField = [
      "values",
      "features",
      "benefits",
      "topics",
      "stories",
      "life_milestones",
      "challenges_overcome",
      "advocacies",
      "problems",
      "fears",
      "obstacles",
      "icp_triggers",
      "action_triggers",
      "purchase_triggers",
    ].includes(key);

    const updatedValue = isArrayField
      ? value.split(",").map((item) => item.trim())
      : value;

    setPersona((prevPersona) => {
      if (!prevPersona) return null;
      return {
        ...prevPersona,
        [section]: {
          ...prevPersona[section as keyof Persona],
          [key]: updatedValue,
        },
      };
    });
  };

  // La fonction handleSave reste inchangée
  const handleSave = async () => {
    if (!user || !profileData) return;
    setIsSaving(true);
    try {
      // Le style d'écriture est déjà correctement défini dans 'profileData.default_writing_style'
      // grâce au 'onChange' du <select>.
      const { error } = await supabase
        .from("profiles")
        .update({
          persona_data: persona,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          job: profileData.job,
          goal: profileData.goal,
          audience: profileData.audience,
          tone: profileData.tone,
          gender: profileData.gender,
          default_writing_style: profileData.default_writing_style,
        })
        .eq("id", user.id);
      if (error) throw error;
      alert("Profil sauvegardé avec succès !");
    } catch (error: any) {
      alert("Erreur lors de la sauvegarde.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="p-6">Chargement du profil...</div>;
  }
  if (!persona) {
    return (
      <div className="p-6">
        Aucun persona n'a été généré. Veuillez compléter l'onboarding.
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Votre Persona Marketing
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("userProfile")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "userProfile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Profil Utilisateur
          </button>
          <button
            onClick={() => setActiveTab("targetAudience")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "targetAudience"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Audience Cible
          </button>
        </nav>
      </div>

      {/* --- Contenu des onglets --- */}
      <div>
        {/* --- Onglet Profil Utilisateur --- */}
        {activeTab === "userProfile" && (
          <div className="space-y-12">
            <Section title="Votre Profil">
              {/* Informations générales en premier */}
              <div className="col-span-full">
                <GeneralProfileInfo
                  defaultStyle={profileData.default_writing_style}
                  customStyle={profileData.custom_writing_style}
                  onStyleChange={handleStyleChange}
                  onCustomStyleSave={handleCustomStyleSave}
                />
              </div>

              {/* Le reste des champs du profil utilisateur */}
              <ProfileField
                label="Qui êtes-vous (Who)"
                name="user_profile.who"
                value={persona.user_profile?.who}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Valeurs (Values)"
                name="user_profile.values"
                value={persona.user_profile?.values}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Rêve (Dream)"
                name="user_profile.dream"
                value={persona.user_profile?.dream}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Objectif (Goal)"
                name="user_profile.goal"
                value={persona.user_profile?.goal}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Opinion Impopulaire"
                name="user_profile.unpopular_opinion"
                value={persona.user_profile?.unpopular_opinion}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Croyance (Belief)"
                name="user_profile.belief"
                value={persona.user_profile?.belief}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Mission"
                name="user_profile.mission"
                value={persona.user_profile?.mission}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Entreprise (Company)"
                name="user_profile.company"
                value={persona.user_profile?.company}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Industrie"
                name="user_profile.industry"
                value={persona.user_profile?.industry}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Produit/Service"
                name="user_profile.product"
                value={persona.user_profile?.product}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Proposition de valeur (Value Prop)"
                name="user_profile.value_prop"
                value={persona.user_profile?.value_prop}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Caractéristiques (Features)"
                name="user_profile.features"
                value={persona.user_profile?.features}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Bénéfices (Benefits)"
                name="user_profile.benefits"
                value={persona.user_profile?.benefits}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="USP"
                name="user_profile.usp"
                value={persona.user_profile?.usp}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Thèmes (Topics)"
                name="user_profile.topics"
                value={persona.user_profile?.topics}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Perspective"
                name="user_profile.perspective"
                value={persona.user_profile?.perspective}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Idéologie"
                name="user_profile.ideology"
                value={persona.user_profile?.ideology}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Histoires (Stories)"
                name="user_profile.stories"
                value={persona.user_profile?.stories}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Étapes de vie (Milestones)"
                name="user_profile.life_milestones"
                value={persona.user_profile?.life_milestones}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Défis surmontés"
                name="user_profile.challenges_overcome"
                value={persona.user_profile?.challenges_overcome}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Causes défendues (Advocacies)"
                name="user_profile.advocacies"
                value={persona.user_profile?.advocacies}
                onChange={handleChange}
                isTextArea
              />
            </Section>
          </div>
        )}

        {/* --- Onglet Audience Cible --- */}
        {activeTab === "targetAudience" && (
          <div>
            <Section title="Informations sur l'Audience Cible">
              <ProfileField
                label="Problèmes"
                name="target_audience.problems"
                value={persona.target_audience?.problems}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Douleur si non résolu"
                name="target_audience.pain_if_unsolved"
                value={persona.target_audience?.pain_if_unsolved}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Frustration"
                name="target_audience.frustration"
                value={persona.target_audience?.frustration}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Douleur secrète"
                name="target_audience.secret_pain"
                value={persona.target_audience?.secret_pain}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Peurs (Fears)"
                name="target_audience.fears"
                value={persona.target_audience?.fears}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Opinion requise"
                name="target_audience.required_opinion"
                value={persona.target_audience?.required_opinion}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Obstacles"
                name="target_audience.obstacles"
                value={persona.target_audience?.obstacles}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Croyance (Belief)"
                name="target_audience.belief"
                value={persona.target_audience?.belief}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Croyance limitante"
                name="target_audience.limiting_belief"
                value={persona.target_audience?.limiting_belief}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Ennemi commun"
                name="target_audience.common_enemy"
                value={persona.target_audience?.common_enemy}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Opinion forte"
                name="target_audience.strong_opinion"
                value={persona.target_audience?.strong_opinion}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Résultat souhaité"
                name="target_audience.desired_result"
                value={persona.target_audience?.desired_result}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Rêve à atteindre"
                name="target_audience.dream_to_achieve"
                value={persona.target_audience?.dream_to_achieve}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Rêve au-delà des problèmes"
                name="target_audience.dream_beyond_problems"
                value={persona.target_audience?.dream_beyond_problems}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Vision idéale du monde"
                name="target_audience.ideal_world_vision"
                value={persona.target_audience?.ideal_world_vision}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Valeurs (Values)"
                name="target_audience.values"
                value={persona.target_audience?.values}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Déclencheurs ICP"
                name="target_audience.icp_triggers"
                value={persona.target_audience?.icp_triggers}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Déclencheurs d'action"
                name="target_audience.action_triggers"
                value={persona.target_audience?.action_triggers}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Déclencheurs d'achat"
                name="target_audience.purchase_triggers"
                value={persona.target_audience?.purchase_triggers}
                onChange={handleChange}
                isTextArea
              />
            </Section>

            <Section title="Persona Détaillé de l'Audience">
              <ProfileField
                label="Verbatim de l'audience"
                name="detailed_persona.verbatim"
                value={persona.detailed_persona?.verbatim}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Perception du secteur"
                name="detailed_persona.sector_perception"
                value={persona.detailed_persona?.sector_perception}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Processus de décision"
                name="detailed_persona.decision_process"
                value={persona.detailed_persona?.decision_process}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Aspirations futures"
                name="detailed_persona.future_aspirations"
                value={persona.detailed_persona?.future_aspirations}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Réactions émotionnelles"
                name="detailed_persona.emotional_reactions"
                value={persona.detailed_persona?.emotional_reactions}
                onChange={handleChange}
                isTextArea
              />
              <ProfileField
                label="Préférences de contenu"
                name="detailed_persona.content_preferences"
                value={persona.detailed_persona?.content_preferences}
                onChange={handleChange}
                isTextArea
              />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
