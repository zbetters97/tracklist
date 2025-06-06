import { useEffect, useRef, useState } from "react";
import { faSort } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "src/features/shared/components/buttons/Button";
import "./sort-button.scss";

export default function SortButton(props) {
  const { results, setResults, sortOptions, sortMethod } = props;

  const [showSort, setShowSort] = useState(false);
  const sorterRef = useRef(null);

  function sortResults(sortValue) {
    const sortedResults = sortMethod(sortValue);
    setResults([...sortedResults]);

    setShowSort(false);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (sorterRef.current && !sorterRef.current.contains(e.target)) {
        setShowSort(false);
      }
    }

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div ref={sorterRef} className="sort">
      <Button
        onClick={() => results?.length > 0 && setShowSort(!showSort)}
        classes="sort__button"
        ariaLabel="sort results by"
      >
        <FontAwesomeIcon icon={faSort} />
        <p>Sort by</p>
      </Button>

      <div className="sort__dropdown" aria-expanded={showSort}>
        {sortOptions.map((option) => (
          <Button
            key={option.value}
            onClick={() => sortResults(option.value)}
            classes="sort__item"
            ariaLabel={option.label}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
