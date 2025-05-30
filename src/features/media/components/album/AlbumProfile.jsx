import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Tabs from "src/features/shared/components/buttons/Tabs";
import ReviewStars from "src/features/review/components/rating/ReviewStars";
import { useReviewContext } from "src/features/review/context/ReviewContext";
import MediaReviews from "../reviews/MediaReviews";
import "./album-profile.scss";

export default function AlbumProfile() {
  const context = useOutletContext();
  const { artist, album, activeTab, setActiveTab, filter, setFilter } = context;

  const tracks = useMemo(() => album?.tracks.items, [album]);

  const tabs = [
    { id: "tracks", label: "Tracks" },
    { id: "reviews", label: "Reviews" },
  ];

  useEffect(() => {
    setActiveTab("tracks");
  }, []);

  return (
    <section className="media__section">
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "reviews" ? (
        <MediaReviews
          mediaId={album?.id}
          filter={filter}
          setFilter={setFilter}
        />
      ) : (
        <TrackList artistId={artist?.id} albumId={album?.id} tracks={tracks} />
      )}
    </section>
  );
}

function TrackList({ artistId, albumId, tracks }) {
  return (
    <div className="tracklist">
      {tracks &&
        tracks.length > 0 &&
        tracks.map((track) => {
          return (
            <TrackCard
              key={track.id}
              track={track}
              artistId={artistId}
              albumId={albumId}
            />
          );
        })}
    </div>
  );
}

function TrackCard({ track, artistId, albumId }) {
  const { getAvgRating } = useReviewContext();
  const [rating, setRating] = useState({});

  useEffect(() => {
    const fetchRating = async () => {
      const { avgRating, count } = await getAvgRating(track.id);

      setRating({ avgRating, count });
    };

    fetchRating();
  }, []);

  return (
    <Link
      to={`/artists/${artistId}/albums/${albumId}/tracks/${track.id}`}
      className="tracklist__card"
    >
      <p className="tracklist__name">
        {track.track_number}. {track.name}
      </p>
      <ReviewStars rating={rating?.avgRating || 0} size={30} />
    </Link>
  );
}
