// Yes
import { useContext } from "react";
import DemoContext from "../store/DemoContext";

export default function useDemos() {
  const payload = useContext(DemoContext);
  return payload;
}
