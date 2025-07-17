import { useState } from 'react';
import './App.css';
import { connectToReef, connectToSqwid } from 'sqwid-sdk';
import {createCollectible} from './utils/mint';

function App() {
  const [isWalletConnected, setWalletConnected] = useState(false);
  const [reefExtensionConnectResponse, setReefExtensionConnectResponse] = useState<any>({});
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>();
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
      const positionId = await createCollectible(
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
          <button
            onClick={async () => {
              await connectToSqwid(reefExtensionConnectResponse.selectedReefSigner);
            }}
          >
            Connect to Sqwid
          </button>

          <hr />

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
                // @ts-ignore
                console.error('REEF ERROR:', state.error.message);
              } else {
                console.log('Accounts:', state);
              }

              setWalletConnected(true);
              setReefExtensionConnectResponse(state);
              // @ts-ignore
              setSelectedAddress(state.selectedReefSigner?.address);
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
