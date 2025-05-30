import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "src/config/firebase";
import { DEFAULT_PROFILE_IMG } from "src/data/const";

export function useAuth() {
  async function signup(email, password, displayname, username, setError) {
    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const newUser = userCredentials.user;

      const result = await createUser(
        email,
        displayname,
        username,
        newUser.uid,
        setError,
      );

      return result;
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("The email address is already in use.");
      } else {
        setError("Something went wrong! Please review fields.");
      }

      return false;
    }
  }

  async function createUser(email, displayname, username, uid, setError) {
    try {
      const newUserData = {
        email: email.toLowerCase(),
        displayname: displayname.toLowerCase(),
        username: username.toLowerCase(),
        bio: "",
        profileUrl: DEFAULT_PROFILE_IMG,
        spotifyUrl: "",
        following: [],
        followers: [],
        lists: [],
        savedLists: [],
        likes: [],
        notifications: 0,
        createdAt: new Date(),
      };

      const userRef = doc(db, "users", uid);
      await setDoc(userRef, newUserData);

      return true;
    } catch (error) {
      console.log(error);
      setError("Something went wrong! Please review fields.");
      return false;
    }
  }

  async function usernameAvailable(username) {
    try {
      username = username.toLowerCase();

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const snapshot = await getDocs(q);

      return snapshot.empty;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async function login(email, password, setError) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError("The email or password is incorrect.");
      } else {
        setError("Something went wrong! Please try again.");
      }

      return false;
    }
  }

  async function loginWithGoogle(setError, username) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (!result.user) return false;

      const user = result.user?.reloadUserInfo;
      const uid = user["uid"] || user.localId;

      const fetchedUser = await getUserById(uid);

      if (username) {
        if (fetchedUser) {
          setError("A user with this email already exists.");
          logout();
          return false;
        } else {
          const result = await createUser(
            user.email,
            user.displayName,
            username,
            uid,
            setError,
          );

          if (!result) {
            logout();
            return false;
          }
        }
      } else if (!fetchedUser) {
        setError("A user with this email does not exist.");
        logout();
        return false;
      }

      return true;
    } catch (error) {
      console.log(error);
      setError("Something went wrong! Please try again.");
      return false;
    }
  }

  function logout() {
    return signOut(auth);
  }

  async function checkIfEmailExists(email) {
    const emailAccounts = await fetchSignInMethodsForEmail(auth, email);
    return emailAccounts.length > 0;
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateSpotifyInfo(userId, profileUrl, spotifyUrl) {
    try {
      if (!userId || !profileUrl || !spotifyUrl) return;

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { profileUrl: profileUrl });
      await updateDoc(userRef, { spotifyUrl: spotifyUrl });
    } catch (error) {
      console.log(error);
    }
  }

  async function getUserById(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return null;

      const user = userDoc.data();
      return {
        uid: userRef.id,
        ...user,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async function getUserByUsername(username) {
    try {
      username = username.toLowerCase();

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const userRef = snapshot.docs[0].ref;
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return null;

      const user = userDoc.data();

      return {
        uid: userRef.id,
        ...user,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async function searchByUser(name, currentUserId) {
    try {
      name = name.toLowerCase();

      const end = name.replace(/.$/, (c) =>
        String.fromCharCode(c.charCodeAt(0) + 1),
      );

      const usersRef = collection(db, "users");

      const qName = query(
        usersRef,
        where("username", ">=", name),
        where("username", "<", end),
      );

      const qEmail = query(
        usersRef,
        where("displayname", ">=", name),
        where("displayname", "<", end),
      );

      const queryName = await getDocs(qName);
      const queryEmail = await getDocs(qEmail);

      const nameUsers = queryName.docs.map((doc) => {
        return {
          uid: doc.id,
          ...doc.data(),
        };
      });

      const emailUsers = queryEmail.docs.map((doc) => {
        return {
          uid: doc.id,
          ...doc.data(),
        };
      });

      const filteredUsers = [
        ...new Map(
          [...nameUsers, ...emailUsers].map((user) => [user.uid, user]),
        ).values(),
      ].filter((user) => user.uid !== currentUserId);

      return filteredUsers;
    } catch (error) {
      console.log(error);
    }
  }

  async function followUser(followerId, userId) {
    try {
      const usersRef = collection(db, "users");
      const currentUserRef = doc(usersRef, userId);
      const followedUserRef = doc(usersRef, followerId);

      if (currentUserRef.empty || followedUserRef.empty) return;

      await updateDoc(currentUserRef, {
        following: arrayUnion(followerId),
      });

      await updateDoc(followedUserRef, {
        followers: arrayUnion(userId),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function unfollowUser(unfollowedId, userId) {
    try {
      const usersRef = collection(db, "users");
      const currentUserRef = doc(usersRef, userId);
      const unfollowedUserRef = doc(usersRef, unfollowedId);

      if (currentUserRef.empty || unfollowedUserRef.empty) return;

      await updateDoc(currentUserRef, {
        following: arrayRemove(unfollowedId),
      });

      await updateDoc(unfollowedUserRef, {
        followers: arrayRemove(userId),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function getFollowingById(userId) {
    try {
      const user = await getUserById(userId);
      if (!user) return;

      return user?.following;
    } catch (error) {
      console.log(error);
    }
  }

  async function getFollowersById(userId) {
    try {
      const user = await getUserById(userId);
      if (!user) return;

      return user?.followers;
    } catch (error) {
      console.log(error);
    }
  }

  async function updateUserDetails(userId, displayname, bio) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { displayname, bio });
    } catch (error) {
      console.log(error);
    }
  }

  async function likeContent(contentId, category, userId) {
    try {
      if (!contentId || !category || !userId) return;

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userRef || userDoc.empty) return;

      const likes = userDoc.data().likes;
      const likeObj = likes.find((like) => like.category === category);

      if (likeObj) {
        // If the category is already in the likes array, add the contentId to its array
        likeObj.content = likeObj.content || [];
        likeObj.content.push(contentId);
      } else {
        // If the category is not in the likes array, create a new object and add it to the array
        likes.push({ category, content: [contentId] });
      }

      await updateDoc(userRef, {
        likes,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function unlikeContent(contentId, userId) {
    try {
      if (!contentId || !userId) return;

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userRef || userDoc.empty) return;

      const likes = userDoc.data().likes;
      const likeObj = likes.find((like) => like.content.includes(contentId));

      if (likeObj) {
        // If the contentId is in the likes array, remove it
        likeObj.content = likeObj.content.filter((id) => id !== contentId);

        // If the content array is empty, remove the like object
        if (likeObj.content.length === 0) {
          likes.splice(likes.indexOf(likeObj), 1);
        }
      }

      await updateDoc(userRef, {
        likes,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function addToInbox(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userRef || userDoc.empty) return;

      await updateDoc(userRef, {
        notifications: increment(1),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function getUnreadInbox(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userRef || userDoc.empty) return;

      return userDoc.data().notifications;
    } catch (error) {
      console.log(error);
    }
  }

  return {
    signup,
    usernameAvailable,
    login,
    loginWithGoogle,
    logout,
    checkIfEmailExists,
    resetPassword,

    getUserById,
    getUserByUsername,
    searchByUser,

    getFollowingById,
    getFollowersById,
    followUser,
    unfollowUser,

    updateUserDetails,
    updateSpotifyInfo,

    likeContent,
    unlikeContent,

    addToInbox,
    getUnreadInbox,
  };
}
