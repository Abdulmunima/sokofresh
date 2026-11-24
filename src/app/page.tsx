import { redirect } from "next/navigation";

// Orders is the home screen. (Login comes in task 1.1.)
export default function Home() {
  redirect("/orders");
}
