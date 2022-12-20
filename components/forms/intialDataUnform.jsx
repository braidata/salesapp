import { Form, Input } from "@unform/web";
import { useRef } from "react";

export default function UnformHubspot({}) {
  const formRef = useRef(null);
  useEffect(() => {
    someApiCall().then((user) => {
      formRef.current.setData({ email: user.email });
    });
  }, []);

  function handleSubmit(data) {
    axios
      .post("/api/apihubspotdeals", {
        data,
      })
      .then((response) => {
        router.push("/success");
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <Form ref={formRef} onSubmit={handleSubmit}>
      <Input mail="true" name="email" type="email" placeholder="Email" />
      <button type="submit">Enviar</button>
    </Form>
  );
}
