import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChakraProvider,
  Box,
  Button,
  Text,
  Heading,
  Code,
  TabPanels,
  TabPanel,
  Tabs,
  TabList,
  Tab,
  VStack,
  HStack,
  Grid,
  theme,
  useToast,
} from '@chakra-ui/react';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import * as web3 from '@solana/web3.js';

import { ColorModeSwitcher } from './ColorModeSwitcher';
import { Greet } from './Greet';

require('@solana/wallet-adapter-react-ui/styles.css');

function useSolanaAccount() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState(null);

  const init = useCallback(async () => {
    let account = await connection.getAccountInfo(publicKey);
    setAccount(account);
    const transactions = await connection.getConfirmedSignaturesForAddress2(
      publicKey,
      {
        limit: 10,
      }
    );
    setTransactions(transactions);
  }, [connection, publicKey]);

  useEffect(() => {
    if (publicKey) {
      setInterval(init, 3000);
    }
  }, [init, publicKey]);

  return { account, transactions };
}

function App() {
  const network = 'devnet';
  const endpoint = web3.clusterApiUrl(network);
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    [network]
  );

  return (
    <ChakraProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Home></Home>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ChakraProvider>
  );
}

function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const { account, transactions } = useSolanaAccount();
  const toast = useToast();

  const [airdropProcessing, setAirdropProcessing] = useState(false);

  const getAirdrop = useCallback(async () => {
    setAirdropProcessing(true);
    try {
      var airdropSignature = await connection.requestAirdrop(
        publicKey,
        web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature);
      setAirdropProcessing(false);
    } catch (error) {
      toast({ title: 'Airdrop failed', description: error });
    }
  }, [toast, connection, publicKey]);
  return (
    <Box textAlign="center" fontSize="xl">
      <Grid minH="100vh" p={3}>
        <Tabs variant="soft-rounded" colorScheme="green">
          <TabList width="full">
            <HStack justify="space-between" width="full">
              <HStack>
                <Tab>Home</Tab>
                <Tab>Transaction History</Tab>
              </HStack>
              <ColorModeSwitcher justifySelf="flex-end" />
            </HStack>
          </TabList>
          <TabPanels>
            <TabPanel>
              {publicKey && (
                <VStack spacing={8}>
                  <Text>Wallet Public Key: {publicKey.toBase58()}</Text>
                  <Text>
                    Balance:{' '}
                    {account
                      ? account.lamports / web3.LAMPORTS_PER_SOL + ' SOL'
                      : 'Loading..'}
                  </Text>
                  <Button onClick={getAirdrop} isLoading={airdropProcessing}>
                    Get Airdrop of 1 SOL
                  </Button>
                  <Greet />
                </VStack>
              )}
              {!publicKey && <WalletMultiButton />}
            </TabPanel>
            <TabPanel>
              {publicKey && (
                <VStack spacing={8}>
                  <Heading>Transactions</Heading>
                  {transactions && (
                    <VStack>
                      {transactions.map((v, i, arr) => (
                        <HStack key={'transaction-' + i}>
                          <Text>Signature: </Text>
                          <Code>{v.signature}</Code>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </VStack>
              )}
              {!publicKey && <WalletMultiButton />}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Grid>
    </Box>
  );
}

export default App;
