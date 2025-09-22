import { get_持仓JSON } from "./utils.js";
export default eventHandler(async (event) => {
  const 持仓JSON = await get_持仓JSON();
  // const all_data = MOCK_DATA;
  return 持仓JSON;
});
