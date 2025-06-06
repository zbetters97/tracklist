import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Tabs from "src/features/shared/components/buttons/Tabs";
import FriendsList from "./FriendsList";
import "./account-friends.scss";

export default function AccountFriends() {
  const { user } = useOutletContext();

  const [activeTab, setActiveTab] = useState("following");

  const tabs = [
    { id: "following", label: "Following" },
    { id: "followers", label: "Followers" },
  ];

  return (
    <section className="account__section">
      <Header />

      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <FriendsList activeTab={activeTab} user={user} />
    </section>
  );
}

function Header() {
  return (
    <div className="account__header">
      <h2 className="account__title">Friends</h2>
    </div>
  );
}
