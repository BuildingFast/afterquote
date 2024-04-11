/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import ShouldRender from "./ShouldRender";
import Skeleton, { type SkeletonProps } from "./Skeleton";

type Props = SkeletonProps & {
  children?: string;
  className?: string;
  loading?: boolean;
};

/**
 * This component receives HTML and renders it on the page.
 *
 *  It is intended to be used to render a post or a comment's body,
 *  which is parsed from markdown into HTML in the server. (tRPC router)
 */
const HTMLBody: React.FC<Props> = ({
  children,
  className,
  loading,
  ...props
}) => {
  return (
    <>
      <ShouldRender if={loading}>
        <Skeleton {...props} />
      </ShouldRender>

      <ShouldRender if={!loading}>
        <div
          className={`${className} prose-emerald markdown__content dark:prose-invert dark:prose-hr:border-neutral-700 break-words`}
          dangerouslySetInnerHTML={{ __html: children || "" }}
        />
      </ShouldRender>
    </>
  );
};

export default HTMLBody;
