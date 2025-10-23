import { useState, useEffect } from "react";
import PostUp from "../../components/post/PostPopup";
import Modal from "../../components/Modal";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Post } from "../../types/Post";
import IdeasGrid from "../../components/creation/IdeasGrid";
import PostGenerator from "../../components/creation/PostGenerator";
import AlertPopup from "../../components/AlertPopup";
import { differenceInDays } from "date-fns";

export default function Creation() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [newPostIds, setNewPostIds] = useState<Set<number>>(new Set());
  const [showRedAlert, setShowRedAlert] = useState(false);
  const [redPostsToDelete, setRedPostsToDelete] = useState<Post[]>([]);

  const handleFomoGeneration = async (
    fomoTargetPost: Post,
    postsForAlert: Post[]
  ) => {
    if (!user || !profile) {
      console.error(
        "Utilisateur ou profil non disponible pour la génération FOMO."
      );
      return;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // On appelle la fonction pour générer la phrase
      const response = await fetch(
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-fomo-sentence",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postContent: fomoTargetPost.content,
            userPersona: profile.persona_data,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Génération FOMO échouée.");

      const fomoSentence = data.fomoSentence;

      // On sauvegarde la phrase dans le profil de l'utilisateur
      await supabase
        .from("profiles")
        .update({ fomo_sentence: fomoSentence })
        .eq("id", user.id);

      // On met à jour l'état local du profil et on déclenche la popup
      setProfile((prev: any) => ({ ...prev, fomo_sentence: fomoSentence }));
      setRedPostsToDelete(postsForAlert);
      setShowRedAlert(true);
    } catch (error) {
      console.error("Erreur lors du processus FOMO:", error);
    }
  };

  const fetchPostsAndProfile = async () => {
    if (!user) return;
    try {
      const [postsResponse, profileResponse] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "Idée"),
        supabase
          .from("profiles")
          .select(
            "id, persona_data, themes, default_writing_style, custom_writing_style, fomo_sentence"
          )
          .eq("id", user.id)
          .single(),
      ]);
      if (postsResponse.error) throw postsResponse.error;
      if (profileResponse.error) throw profileResponse.error;
      const fetchedPosts = postsResponse.data || [];
      const fetchedProfile = profileResponse.data;

      setAllPosts(fetchedPosts);
      setProfile(fetchedProfile);

      const now = new Date();
      const triggerPosts = fetchedPosts.filter(
        (p) => differenceInDays(now, new Date(p.last_status_date)) >= 35
      );

      if (triggerPosts.length > 0 && !fetchedProfile.fomo_sentence) {
        const postsForAlert = fetchedPosts.filter((p) => {
          const age = differenceInDays(now, new Date(p.last_status_date));
          return age >= 30 && age < 60;
        });

        if (postsForAlert.length > 0) {
          handleFomoGeneration(postsForAlert[0], postsForAlert);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkGenerate = async () => {
    if (!user || !profile) return;
    setIsBulkGenerating(true);
    try {
      const functionUrl = `https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-four-posts`;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session non trouvée.");

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          themes: profile.themes,
          persona_data: profile.persona_data,
        }),
      });

      const responseData = await response.json();
      if (!response.ok)
        throw new Error(responseData.error || "La génération a échoué.");

      const { posts: newPosts } = responseData;
      const postsToInsert = newPosts.map((postData: any) => ({
        ...postData,
        user_id: user.id,
        status: "Idée",
      }));
      const { data: insertedPosts, error } = await supabase
        .from("posts")
        .insert(postsToInsert)
        .select("id");
      if (error) throw error;

      const newIds = insertedPosts.map((p) => p.id);
      setNewPostIds((prev) => new Set([...prev, ...newIds]));
      await fetchPostsAndProfile();

      setTimeout(() => {
        setNewPostIds((prev) => {
          const newSet = new Set(prev);
          newIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }, 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleDeleteRedPosts = async (postsToDelete: Post[]) => {
    if (!user || postsToDelete.length === 0) return;

    const idsToDelete = postsToDelete.map((post) => post.id);

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      // On vide la phrase fomo pour qu'elle soit régénérée la prochaine fois
      await supabase
        .from("profiles")
        .update({ fomo_sentence: null })
        .eq("id", user.id);

      alert(`${idsToDelete.length} idée(s) inactive(s) ont été supprimée(s).`);

      setShowRedAlert(false); // On ferme la popup
      fetchPostsAndProfile(); // On rafraîchit la liste des posts
    } catch (error: any) {
      alert(`Erreur lors de la suppression : ${error.message}`);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPostsAndProfile();
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <IdeasGrid
        posts={allPosts}
        newPostIds={newPostIds}
        onPostSelect={setSelectedPost}
        onBulkGenerate={handleBulkGenerate}
        isBulkGenerating={isBulkGenerating}
      />
      <PostGenerator
        user={user}
        profile={profile}
        onPostSaved={(newPost) => {
          setAllPosts((prev) => [newPost, ...prev]);
          const updatedIds = new Set(newPostIds).add(newPost.id);
          setNewPostIds(updatedIds);
          setTimeout(() => {
            setNewPostIds((prev) => {
              const newIds = new Set(prev);
              newIds.delete(newPost.id);
              return newIds;
            });
          }, 3000);
        }}
        onPostsGenerated={fetchPostsAndProfile}
      />

      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)}>
        {selectedPost && (
          <PostUp
            post={selectedPost}
            userId={user?.id || ""}
            onClose={() => setSelectedPost(null)}
            onUpdate={fetchPostsAndProfile}
          />
        )}
      </Modal>

      {showRedAlert && profile && (
        <AlertPopup
          postsToDelete={redPostsToDelete}
          profile={profile}
          onClose={() => setShowRedAlert(false)}
          onDelete={handleDeleteRedPosts}
        />
      )}
    </div>
  );
}
