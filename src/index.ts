import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  return res.status(200).json({
    name: "Diego",
    surname: "Palomar",
  });
});

app.get("/faq", (req, res) => {
  const userQuestion = req.query.q;

  if (!userQuestion) {
    return res.status(400).json({ error: "Question is required" });
  } else {
    res.send("Your question is: " + userQuestion);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
