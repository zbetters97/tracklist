import { useEffect, useState } from "react";
import Modal from "src/features/shared/components/modal/Modal";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Button from "src/features/shared/components/buttons/Button";
import SuccessAlert from "src/features/shared/components/alerts/SuccessAlert";
import PasswordReset from "../forms/PasswordReset";

export default function ForgotPasswordButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("lock-scroll");
    }

    return () => {
      setSuccess(false);
    };
  }, [isModalOpen]);

  return (
    <div>
      {success ? (
        <Modal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
          <SuccessAlert
            message="Reset email sent!"
            link="Go to login"
            icon={faArrowRight}
            onClick={() => setIsModalOpen(false)}
          />
        </Modal>
      ) : (
        <Modal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
          <PasswordReset isModalOpen={isModalOpen} setSuccess={setSuccess} />
        </Modal>
      )}

      <div className="reset">
        <p>Forgot password?</p>
        <Button
          onClick={() => setIsModalOpen(true)}
          classes="link reset__link"
          ariaLabel="go to reset password"
        >
          Click here
        </Button>
      </div>
    </div>
  );
}
