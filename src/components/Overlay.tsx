export function Overlay(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <span className="grid grid-cols-1 grid-rows-1 justify-items-center [&>*]:col-start-1 [&>*]:row-start-1">
      {children}
    </span>
  );
}
