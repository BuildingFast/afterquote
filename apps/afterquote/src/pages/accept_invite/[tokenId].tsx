import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Confetti from "react-dom-confetti";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

export default function InviteAccepted() {
  const confettiConfig = {
    angle: 90,
    spread: 180,
    startVelocity: 45,
    elementCount: 200,
    decay: 0.9,
    colors: ["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#F33A6A", "#FF5733"],
    duration: 4000,
  };
  const router = useRouter();
  const { tokenId } = router.query;
  const updateUserOrg = api.invite?.acceptInvite.useMutation();
  const [showConfetti, setShowConfetti] = useState(false); // State to control confetti display

  useEffect(() => {
    updateUserOrg.mutate({ tokenId: String(tokenId) });

    // Set showConfetti to true after a delay of 2 seconds
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 1000);

    // Clear the timer on component unmount
    return () => clearTimeout(timer);
  }, [tokenId]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <Confetti active={showConfetti} config={confettiConfig} />{" "}
      <Image src="/success.svg" width={400} height={500} alt="" />
      <h1 className="text-2xl font-medium text-slate-800">Invite Accepted!</h1>
      <Button
        size="lg"
        className="mt-4"
        onClick={() => {
          void router.push("/");
        }}
      >
        Continue
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
