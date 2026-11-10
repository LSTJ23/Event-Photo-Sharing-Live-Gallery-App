import Link from "next/link";
import Icon from "./Icon";

export function BackLink({ href, children }) {
  return <Link href={href} className="back"><Icon name="back" />{children}</Link>;
}

export default function PageHead({ event, title }) {
  return (
    <>
      <BackLink href="/events">Events</BackLink>
      <h1>{title}</h1>
      <p className="sub">{event.name} · {event.when}</p>
    </>
  );
}
