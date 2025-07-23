import { useState } from 'react';
import './App.css';
import { connectToReef, connectToSqwid,sqwidWrite,sqwidRead } from '@reef-chain/sqwid-sdk';
import { fetchUserItems, getUserCollections } from './utils/getUserCollections';

function App() {
  const [isWalletConnected, setWalletConnected] = useState(false);
  const [reefExtensionConnectResponse, setReefExtensionConnectResponse] = useState<any>({});
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>();
  const [ownerCollections, setOwnerCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    collection: '',
    royalty: '',
    copies: 1,
    royaltyRecipient: '',
    properties: [],
    file: null,
    coverFile: null,
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: any) => {
    const { name, files } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: files[0] }));
  };

  const handleCreate = async () => {
    if (!reefExtensionConnectResponse.selectedReefSigner) {
      alert('No signer connected.');
      return;
    }

    try {
      const positionId = await sqwidWrite.createCollectible(
        formData,
        reefExtensionConnectResponse.provider,
        reefExtensionConnectResponse.selectedReefSigner.signer
      );
      if (positionId?.error) {
        console.error('Error creating collectible:', positionId.error);
      } else {
        alert(`Collectible created! Position ID: ${positionId}`);
      }
    } catch (err) {
      console.error('Failed to create collectible:', err);
    }
  };

  return (
    <>
      <h1>Sqwid-SDK Sample</h1>

      {isWalletConnected && reefExtensionConnectResponse && (
        <>
          {reefExtensionConnectResponse.error && (
            <p className="error">{reefExtensionConnectResponse.error.message}</p>
          )}

          {reefExtensionConnectResponse.selectedReefSigner && (
            <p>Connected to: {reefExtensionConnectResponse.selectedReefSigner.name}</p>
          )}

          {reefExtensionConnectResponse.signers?.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <select
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
              >
                <option value="">-- Select an account --</option>
                {reefExtensionConnectResponse.signers.map((signer: any) => (
                  <option key={signer.address} value={signer.address}>
                    {signer.name || signer.address}
                  </option>
                ))}
              </select>

              <button
                disabled={!selectedAddress}
                style={{ marginLeft: '10px' }}
                onClick={() => {
                  if (selectedAddress) {
                    reefExtensionConnectResponse.reefState.setSelectedAddress(selectedAddress);
                    console.log(`Switched to ${selectedAddress}`);
                  }
                }}
              >
                Select Account
              </button>
            </div>
          )}

          <br />
          <button onClick={() => console.log(reefExtensionConnectResponse)}>
            Log Connect Reef Response
          </button>

          <br />
          <button onClick={async () => console.log(await sqwidRead.fetchCollectionsByStats(sqwidRead.STATS_ORDER.ITEMS))}>
            Fetch Collections
          </button>

          <br />
          <button onClick={async () => console.log(await sqwidRead.fetchCollectionInfo("aLbM95hd62nkFe7Du07k"))}>
            Fetch ID: aLbM95hd62nkFe7Du07k
          </button>

          <br />
          <button
            onClick={async () => {
              if (!selectedAddress) return alert("Please select an address first.");
              const collections = await sqwidRead.getUserCollections(selectedAddress);
              console.log("Owner collections:", collections);
              setOwnerCollections(collections);
            }}
          >
            Fetch Owner Collections
          </button>

          <br />
          <button
            onClick={async () => {
              await connectToSqwid(reefExtensionConnectResponse.selectedReefSigner);
            }}
          >
            Connect to Sqwid
          </button>
          <hr/>
          <button
            onClick={async () => {
              const response = await getUserCollections(reefExtensionConnectResponse.selectedReefSigner.evmAddress);
              console.log("Fetch User Collections Response:",response)
            }}
          >
            Fetch User Collections
          </button>
          <br/>
          <button
            onClick={async () => {
              const response = await fetchUserItems("0x145f71b75c154f1bc7df53d2958324305c64f031",1);
              console.log("Fetch User Items Response:",response)
            }}
          >
            Fetch User Collections
          </button>

          <hr />

          {/* Dropdown for owner collections */}
          {ownerCollections.length > 0 && (
            <div>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
              >
                <option value="">-- Select a collection --</option>
                {ownerCollections.map((col: any, index: number) => (
                  <option key={col.id || `${col.name}-${index}`} value={col.id}>
                    {col.id}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectedCol = ownerCollections.find(col => col._id === selectedCollectionId);
                  if (selectedCol) {
                    setFormData((prev: any) => ({ ...prev, collection: selectedCol.name }));
                  }
                }}
                disabled={!selectedCollectionId}
                style={{ marginLeft: '10px' }}
              >
                Select Collection
              </button>
            </div>
          )}

          <h2>Mint Collectible</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <br />
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
            <br />
            <input
              type="text"
              name="collection"
              placeholder="Collection"
              value={formData.collection}
              onChange={handleInputChange}
              required
            />
            <br />
            <input
              type="number"
              name="copies"
              placeholder="Copies"
              value={formData.copies}
              onChange={handleInputChange}
              min={1}
            />
            <br />
            <input
              type="number"
              name="royalty"
              placeholder="Royalty %"
              value={formData.royalty}
              onChange={handleInputChange}
              min={0}
              max={100}
            />
            <br />
            <input
              type="text"
              name="royaltyRecipient"
              placeholder="Royalty Recipient (optional)"
              value={formData.royaltyRecipient}
              onChange={handleInputChange}
            />
            <br />
            <input
              type="file"
              name="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
              required
            />
            <br />
            <input
              type="file"
              name="coverFile"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            <br />
            <button type="submit">Mint NFT</button>
          </form>
        </>
      )}

      {!isWalletConnected && (
        <button
          onClick={async () => {
            const reef$ = connectToReef('sqwid-sdk-sample');

            reef$.subscribe((state) => {
              if (state.loading) return;

              if (state.error) {
                console.error('REEF ERROR:', (state.error as any).message);
              } else {
                console.log('Reef State:', state);
              }

              setWalletConnected(true);
              setReefExtensionConnectResponse(state);
              setSelectedAddress((state.selectedReefSigner as any).address);
            });
          }}
        >
          Connect Wallet
        </button>
      )}
    </>
  );
}

export default App;
