import { useEffect, useState } from "react";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "src/features/shared/components/buttons/Button";
import { useAuthContext } from "src/features/auth/context/AuthContext";
import { ACCOUNT_BIO_LIMIT, ACCOUNT_NAME_LIMIT } from "src/data/const";
import { useSpotifyContext } from "src/features/media/context/SpotifyContext";
import "./account-form.scss";

export default function AccountForm({ isModalOpen, setIsModalOpen }) {
  const { globalUser, updateUserDetails } = useAuthContext();

  const [name, setName] = useState(globalUser?.displayname || "");
  const [bio, setBio] = useState(globalUser?.bio || "");

  useEffect(() => {
    if (!isModalOpen) {
      resetValues();
    }

    const handleValues = () => {
      if (globalUser) {
        setName(globalUser.displayname);
        setBio(globalUser.bio);
      }
    };

    handleValues();
  }, [isModalOpen, globalUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!globalUser || name === "" || bio === "") return;

    await updateUserDetails(globalUser.uid, name, bio);

    setIsModalOpen(false);
    window.location.reload();
    resetValues();
  };

  const resetValues = () => {
    setName("");
    setBio("");
  };

  return (
    <form onSubmit={handleSubmit} className="form user-form">
      <FormHeader />
      <div className="form__content user-form__content">
        <FormImage globalUser={globalUser} />

        <div className="user-form__info">
          <FormName name={name} setName={setName} />
          <FormBio bio={bio} setBio={setBio} />
        </div>
      </div>
      <FormButton />
    </form>
  );
}

function FormHeader() {
  return <p className="form__header">Edit Account</p>;
}

function FormImage({ globalUser }) {
  const { redirectToSpotifyAuth } = useSpotifyContext();

  return (
    <div className="user-form__profile">
      <img src={globalUser?.profileUrl} className="user-form__image" />

      <Button
        onClick={() => redirectToSpotifyAuth(false)}
        classes="basic-button user-form__spotify"
        ariaLabel="sync with spotify"
      >
        <FontAwesomeIcon icon={faSpotify} />
        <p>{globalUser?.spotifyUrl ? "Resync" : "Sync"}</p>
      </Button>
    </div>
  );
}

function FormName({ name, setName }) {
  const color = name.length >= ACCOUNT_NAME_LIMIT ? "red" : "gray";

  const handleChange = (e) => {
    if (e.target.value.length > ACCOUNT_NAME_LIMIT) {
      setName(e.target.value.slice(0, ACCOUNT_NAME_LIMIT));
      return;
    }

    setName(e.target.value);
  };

  return (
    <div className="user-form__inputs">
      <div className="user-form__label">
        <label htmlFor="name">Display name</label>
        <p style={{ color: color }}>
          {name.length || 0}/{ACCOUNT_NAME_LIMIT}
        </p>
      </div>
      <input
        name="name"
        type="text"
        value={name}
        onChange={handleChange}
        className="form__input user-form__name"
      />
    </div>
  );
}

function FormBio({ bio, setBio }) {
  const color = bio.length >= ACCOUNT_BIO_LIMIT ? "red" : "gray";

  const handleChange = (e) => {
    if (e.target.value.length > ACCOUNT_BIO_LIMIT) {
      setBio(e.target.value.slice(0, ACCOUNT_BIO_LIMIT));
      return;
    }

    setBio(e.target.value);
  };

  return (
    <div className="form__textarea">
      <div className="user-form__label">
        <label htmlFor="bio">Bio</label>
        <p style={{ color: color }}>
          {bio.length || 0}/{ACCOUNT_BIO_LIMIT}
        </p>
      </div>
      <textarea
        name="bio"
        type="text"
        value={bio}
        onChange={handleChange}
        className="form__textarea--input"
      />
    </div>
  );
}

function FormButton() {
  return (
    <Button type="submit" classes="form__submit" ariaLabel="save changes">
      <p>Save</p>
    </Button>
  );
}
