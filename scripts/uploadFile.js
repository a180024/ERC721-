const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

// const JSONBody = JSON.stringify({
// name: "The Chainlink Elf",
// description:
// "Inspiring, Based, Mythical, Oracle loving creature. Leading the new world and helping teach about superior digital agreements. Also is good with a bow!",
// attributes: {
// trait_type: "Strength",
// value: 84,
// },
// image: "https://gateway.pinata.cloud/ipfs/QmVELgsFNp6yLjgsQcPnf6mR4amcKGjeJ5YXEmZvDVgp7Y"
// });

//Pins JSON Object
const pinJSONToIPFS = async (JSONBody) => {
  const pinataApiKey = process.env.PINATA_KEY;
  const pinataSecretApiKey = process.env.PINATA_SECRET_KEY;
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  return axios
    .post(url, JSONBody, {
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then(function (response) {
      console.log(response.data.IpfsHash);
      return {
        success: true,
        pinataUrl:
          "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash,
      };
    })
    .catch(function (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
      };
    });
};

//Pins Image
const pinFileToIPFS = async () => {
  const pinataApiKey = process.env.PINATA_KEY;
  const pinataSecretApiKey = process.env.PINATA_SECRET_KEY;
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  let data = FormData();
  data.append(
    "file",
    fs.createReadStream(path.join(__dirname, "/../assets/pinata.png"))
  );

  await axios
    .post(url, data, {
      headers: {
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then(function (response) {
      console.log(response.data.IpfsHash);
      return {
        success: true,
        pinataUrl:
          "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash,
      };
    })
    .catch(function (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
      };
    });
};
