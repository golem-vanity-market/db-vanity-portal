import { Annotation, createClient, GolemBaseClient, GolemBaseCreate, Tagged } from "golem-base-sdk";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";

const utf8Decode = new TextDecoder();

const getEthereumGlobal = () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
};

function decodeCreate(entity: GolemBaseCreate | undefined | null) {
  try {
    if (!entity) return null;
    const decodedData = utf8Decode.decode(entity.data);
    return JSON.parse(decodedData);
  } catch (error) {
    console.error("Failed to decode entity data:", error);
    return null;
  }
}

function jsonEntityToString(entity: GolemBaseCreate | undefined | null) {
  try {
    if (!entity) return "";
    const stringAnnot: Record<string, string> = {};
    const numericAnnot: Record<string, number> = {};
    entity.stringAnnotations.map((ann) => {
      stringAnnot[ann.key] = ann.value;
    });
    entity.numericAnnotations.map((ann) => {
      numericAnnot[ann.key] = ann.value;
    });
    return JSON.stringify(
      {
        data: decodeCreate(entity),
        btl: entity.btl,
        stringAnnotations: stringAnnot,
        numericAnnotations: numericAnnot,
      },
      null,
      2,
    );
  } catch (error) {
    console.error("Failed to stringify entity:", error);
    return "";
  }
}

export const AccountPage = () => {
  /*const [publicClient, setPublicClient] = useState<GolemBaseROClient | null>(
    createROClient(
      parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
      import.meta.env.VITE_GOLEM_DB_RPC,
      import.meta.env.VITE_GOLEM_DB_RPC_WS,
    ),
  );*/

  const [signingMessage, setSigningMessage] = useState<boolean>(false);
  const [client, setClient] = useState<GolemBaseClient | null>(null);

  const [publicKey, setPublicKey] = useState<string>(
    "0x04d4a96d675423cc05f60409c48b084a53d3fa0ac59957939f526505c43f975b77fabab74decd66d80396308db9cb4db13b0c273811d51a1773d6d9e2dbcac1d28",
  );
  const [prefix, setPrefix] = useState<string>("");

  const [entity, setEntity] = useState<GolemBaseCreate | null>(null);

  useEffect(() => {
    const utf8Encode = new TextEncoder();

    setEntity({
      data: utf8Encode.encode(
        JSON.stringify(
          {
            prefix,
            publicKey,
            fundingHash: "0x",
          },
          null,
          2,
        ),
      ),
      btl: 100,
      stringAnnotations: [new Annotation("vanity_market_request", "1")],
      numericAnnotations: [],
    });
  }, [prefix, publicKey]);

  async function signMessage() {
    setSigningMessage(true);

    try {
      const utf8Encode = new TextEncoder();

      const golemClient = await createClient(
        parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
        new Tagged("ethereumprovider", getEthereumGlobal()),
        import.meta.env.VITE_GOLEM_DB_RPC,
        import.meta.env.VITE_GOLEM_DB_RPC_WS,
      );
      setClient(golemClient);
      const [_receipt] = await golemClient.createEntities([
        {
          data: utf8Encode.encode("foo"),
          btl: 25,
          stringAnnotations: [new Annotation("key", "foo")],
          numericAnnotations: [new Annotation("ix", 1)],
        },
      ]);
    } catch (ex) {
      console.error("Failed to sign message:", ex);
    } finally {
      setSigningMessage(false);
    }

    // console.log('Broadcasted tx hash:', txHash)
  }

  useEffect(() => {
    if (!getEthereumGlobal()) {
      console.error("MetaMask is not installed");
      return;
    }

    createClient(
      parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
      new Tagged("ethereumprovider", getEthereumGlobal()),
      import.meta.env.VITE_GOLEM_DB_RPC,
      import.meta.env.VITE_GOLEM_DB_RPC_WS,
    )
      .then(setClient)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 className={"mb-4 text-2xl font-bold"}>Account Information</h2>

      {client ? (
        <div className={"mb-4 rounded border border-gray-300 bg-yellow-50 p-4"}>
          Wallet connected with address: {client.getRawClient().walletClient.account.address}
        </div>
      ) : (
        <div className={"mb-4 rounded border border-gray-300 bg-yellow-50 p-4"}>Connect MetaMask to continue</div>
      )}

      <div className={"mb-4 rounded border border-gray-300 bg-blue-50 p-4"}>
        <div className="mb-4 w-sm">
          <Label htmlFor="publicKeySearch">Public key search</Label>
          <Input
            id="publicKeySearch"
            placeholder="public key..."
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
          />
        </div>
        <div className="mb-4 w-sm">
          <Label htmlFor="prefixSearch">Prefix</Label>
          <Input
            id="prefixSearch"
            placeholder="0x123456..."
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>

        <div>Following entity will be created and sent to Golem DB:</div>

        <div className={"mb-4 bg-white p-4"}>
          <textarea
            style={{ textWrap: "nowrap" }}
            className={"h-80 w-full font-mono"}
            value={jsonEntityToString(entity)}
          ></textarea>
        </div>
        {signingMessage ? (
          <div className={"mb-4 rounded border border-gray-300 bg-blue-50 p-4"}>Signing message...</div>
        ) : (
          <div>
            <button onClick={() => signMessage()}>Send request to Golem DB</button>
          </div>
        )}
      </div>
    </div>
  );
};
