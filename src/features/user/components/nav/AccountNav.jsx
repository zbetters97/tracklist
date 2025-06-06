import { Link, useLocation } from "react-router-dom";
import ChatButton from "../buttons/ChatButton";
import LogoutButton from "../buttons/LogoutButton";
import "./account-nav.scss";

export default function AccountNav({ user, canEdit }) {
  return (
    <nav className="account-nav">
      <Profile user={user} />
      <NavLinks username={user.username} />
      {canEdit ? <LogoutButton /> : <ChatButton username={user.username} />}
    </nav>
  );
}

function Profile({ user }) {
  const location = useLocation();

  const isHomePage =
    location.pathname === "/profile" ||
    location.pathname === `/users/${user.username}` ||
    location.pathname === `/users/${user.username}/profile`;

  return (
    <Link
      to={`/users/${user.username}`}
      className="account-nav__link"
      aria-selected={isHomePage ? "true" : "false"}
    >
      <img
        src={user.profileUrl}
        className="account-nav__image"
        alt="user profile"
      />
      <p>{user.username}</p>
    </Link>
  );
}

function NavLinks({ username }) {
  const children = [
    { id: "reviews", title: "Reviews" },
    { id: "lists", title: "Lists" },
    { id: "likes", title: "Likes" },
    { id: "friends", title: "Friends" },
  ];

  const location = useLocation();

  const isActive = (page) => {
    return location.pathname.startsWith(`/users/${username}/${page}`);
  };

  return (
    <div className="account-nav__links">
      {children.map((child) => (
        <Link
          key={child.id}
          to={`/users/${username}/${child.id}`}
          className="account-nav__link"
          aria-selected={isActive(child.id) ? "true" : "false"}
        >
          {child.title}
        </Link>
      ))}
    </div>
  );
}
