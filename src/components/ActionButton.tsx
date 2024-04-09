import React from "react";
import { XCircle, Trash, Pencil } from "lucide-react";

type Actions = "delete" | "edit" | "close";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  action: Actions;
};

const iconProps = {
  className: "text-blue-500 xl:w-[23px] xl:h-[23px] w-5 h-5",
};

const icons: Record<Actions, React.ReactNode> = {
  close: <XCircle {...iconProps} />,
  delete: <Trash {...iconProps} />,
  edit: <Pencil {...iconProps} />,
};

const ActionButton: React.FC<Props> = (props) => {
  const { action, className = "" } = props;

  return (
    <button
      {...props}
      className={`rounded-md bg-teal-100 p-2 shadow-lg hover:opacity-70 dark:bg-teal-900 ${className}`}
    >
      {icons[action]}
    </button>
  );
};

export default ActionButton;
