import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_MEDIA_IMG } from "src/data/const";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Alert from "src/features/shared/components/alerts/Alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "src/features/shared/components/buttons/Button";
import { useAuthContext } from "src/features/auth/context/AuthContext";
import { useChatContext } from "src/features/chat/context/ChatContext";
import { useReviewContext } from "src/features/review/context/ReviewContext";
import { useSpotifyContext } from "src/features/media/context/SpotifyContext";
import "./share-form.scss";

export default function ShareForm(props) {
  const { isModalOpen, setIsModalOpen, mediaId, category } = props;

  const { globalUser } = useAuthContext();
  const { chats, addChat, sendMessage } = useChatContext();
  const { getReviewById } = useReviewContext();
  const { getMediaById } = useSpotifyContext();

  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [media, setMedia] = useState(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUsers, setCurrentUser] = useState([]);

  const formRef = useRef(null);

  useEffect(() => {
    handleModal();
    handleData();
  }, [isModalOpen]);

  function handleModal() {
    if (isModalOpen) resetValues();
  }

  async function handleData() {
    if (!globalUser || !mediaId || !category) return;

    const fetchedMedia =
      category === "review"
        ? await getReviewById(mediaId, category)
        : await getMediaById(mediaId, category);

    setMedia(fetchedMedia);

    if (!fetchedMedia) {
      resetValues();
      setIsModalOpen(false);
    }
  }

  async function handleAddUser(user) {
    setCurrentUser([...currentUsers, user]);

    setUsers([]);
    setInput("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateData()) return;

    // For each added user
    currentUsers.forEach(async (user) => {
      // Find the chat between the current user and the added user
      const foundChat = chats.find((chat) => chat.recipientId === user.uid);

      // Get the chat ID of found chat or create new one
      const chatId = foundChat
        ? foundChat.chatId
        : await addChat(globalUser.uid, user.uid);

      // Send message to user with media ID and media category
      await sendMessage(chatId, globalUser.uid, user.uid, media.id, category);

      // Send message to user after sending media
      if (message === "") return;
      await sendMessage(chatId, globalUser.uid, user.uid, message);
    });

    resetValues();
    setIsModalOpen(false);

    // Send to messages page
    navigate("/messages");
  }

  function validateData() {
    const friendInput = formRef.current.elements["friend"];

    if (!globalUser) {
      setError("Please sign in to submit a review.");
      return false;
    }

    if (!media || !media.id) {
      setError("Please select media to share.");
      return false;
    }

    if (currentUsers.length === 0) {
      friendInput.classList.add("form__input--invalid");
      setError("Please select at least one friend.");
      return false;
    }

    return true;
  }

  function resetValues() {
    setMedia(null);
    setInput("");
    setUsers([]);
    setCurrentUser([]);
    setMessage("");
    setError("");
    formRef.current.elements["friend"].classList.remove("form__input--invalid");
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form share-form">
      <FormHeader category={category} />

      <div className="form__content">
        <FormImage media={media} />

        <div className="share-form__search">
          <FormInput
            input={input}
            setInput={setInput}
            setUsers={setUsers}
            currentUsers={currentUsers}
          />
          <FormUserResults users={users} handleAddUser={handleAddUser} />

          <FormUsersList
            currentUsers={currentUsers}
            setCurrentUser={setCurrentUser}
          />
        </div>
      </div>
      <FormMessage message={message} setMessage={setMessage} />

      <Alert message={error} />
      <FormButton currentUsers={currentUsers} />
    </form>
  );
}

function FormHeader({ category }) {
  return (
    <p className="form__header">{`Share this ${category} with friends`}</p>
  );
}

function FormImage({ media }) {
  return (
    <img
      src={media?.media?.image || media?.image || DEFAULT_MEDIA_IMG}
      className="form__image"
    />
  );
}

function FormInput({ input, setInput, setUsers, currentUsers }) {
  const { globalUser, searchByUser } = useAuthContext();

  async function handleSearch(e) {
    setInput(e.target.value);

    if (e.target.value === "") {
      setUsers([]);
      return;
    }

    const fetchedUsers = await searchByUser(input, globalUser.uid);

    // Remove users that are already in the currentUsers array
    const filteredUsers = fetchedUsers.filter(
      (user) =>
        !currentUsers.some((currentUser) => currentUser.uid === user.uid),
    );

    // Sort by following first, then by username
    filteredUsers.sort((a, b) => {
      return (
        globalUser.following.includes(b.uid) -
          globalUser.following.includes(a.uid) ||
        a.username.localeCompare(b.username)
      );
    });

    setUsers(filteredUsers);
  }

  return (
    <input
      value={input}
      onChange={handleSearch}
      type="text"
      placeholder="Search for a friend..."
      className="form__input"
      name="friend"
    />
  );
}

function FormUserResults({ users, handleAddUser }) {
  return (
    <div
      className="share-form__search__dropdown"
      aria-expanded={users.length > 0}
    >
      {users.map((user) => (
        <Button
          key={user.uid}
          onClick={() => handleAddUser(user)}
          classes="share-form__search__item"
          ariaLabel="add user to share contet"
        >
          <img
            src={user.profileUrl}
            className="share-form__search__image"
            alt="shared media"
          />
          <div className="share-form__search__info">
            <p className="share-form__search__displayname">
              {user.displayname}
            </p>
            <span className="share-form__search__username">
              @{user.username}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );
}

function FormUsersList({ currentUsers, setCurrentUser }) {
  function handleRemoveUser(userId) {
    setCurrentUser(currentUsers.filter((user) => user.uid !== userId));
  }

  return (
    <div className="share-form__users">
      {currentUsers?.map((user) => {
        return (
          <div key={user.uid} className="share-form__user">
            <p className="share-form__user__username">@{user.username}</p>
            <Button
              onClick={() => handleRemoveUser(user.uid)}
              classes="share-form__user__remove"
              ariaLabel="remove user to share content"
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function FormMessage({ message, setMessage }) {
  function handleChange(e) {
    setMessage(e.target.value);
  }

  return (
    <input
      type="text"
      value={message}
      onChange={handleChange}
      placeholder="Include a message..."
      className="form__input"
    />
  );
}

function FormButton({ currentUsers }) {
  return (
    <Button type="submit" classes="form__submit" ariaLabel="share content">
      <p>{`Send${currentUsers.length > 1 ? " seperately" : ""} `}</p>
    </Button>
  );
}
