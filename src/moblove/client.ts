import { Axios } from "axios";

export const client = new Axios({
  baseURL: "https://www.pactoimobiliaria.com.br/",
});