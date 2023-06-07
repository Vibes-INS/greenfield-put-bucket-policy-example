import { Button, ChakraProvider, Flex, Input } from '@chakra-ui/react'
import { useAccount, WagmiConfig } from 'wagmi'
import { ConnectButton, darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { Chain, configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { FC, useCallback, useState } from 'react'
import { newBucketGRN, GRNToString, Client } from '@bnb-chain/greenfield-chain-sdk'
import '@rainbow-me/rainbowkit/styles.css'


const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.nodereal.io'
// const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org'

export const greenfieldTestnet: Chain = {
  id: 5600,
  name: 'Greenfield Testnet',
  network: 'greenfield-testnet',
  rpcUrls: {
    default: {
      http: [GRPC_URL],
    },
    public: {
      http: [GRPC_URL],
    },
  },
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'tBNB',
  },
  testnet: true,
}

const { chains, publicClient } = configureChains(
  [greenfieldTestnet],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Test',
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export const client = Client.create(
  greenfieldTestnet.rpcUrls.default.http[0],
  String(greenfieldTestnet.id)
)


const PutBucketPolicyButton: FC = () => {
  const { address } = useAccount()
  const [bucketName, setBucketName] = useState('')
  const onClick = useCallback(
    async (bucketName: string) => {
      if (!address) return
      const tx = await client.bucket.putBucketPolicy({
        operator: address,
        resource: GRNToString(newBucketGRN(bucketName)),
        principal: {
          type: 2,
          value: '32',
        },
        statements: [
          {
            effect: 1,
            actions: [6],
            resources: [],
          },
        ],
      })

      const s = await tx.simulate({
        denom: 'BNB',
      })

      return await tx.broadcast({
        denom: 'BNB',
        gasLimit: Number(s?.gasLimit),
        gasPrice: s?.gasPrice || '5000000000',
        payer: address,
        granter: '',
      })
    },
    [address]
  )
  return <Flex border="1px solid #000" direction="column" p={4}>
    BucketName: 
    <Input onChange={e => setBucketName(e.target.value)} value={bucketName} />
    <Button onClick={() => onClick(bucketName)}>Put Bucket Policy</Button>
  </Flex>
}


function App() {
  return (
    <ChakraProvider>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains} theme={darkTheme()}>
          <ConnectButton />
          <PutBucketPolicyButton/>
        </RainbowKitProvider>
      </WagmiConfig>
    </ChakraProvider>
  )
}

export default App
