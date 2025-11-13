# Decentralization & Censorship Resistance

## Overview

The Alternate Futures CLI is built with **censorship resistance** and **decentralization** as core principles. This document outlines the decentralized features, architectures, and best practices for building unstoppable applications.

---

## Table of Contents

1. [Why Decentralization Matters](#why-decentralization-matters)
2. [Decentralized Storage (IPFS)](#decentralized-storage-ipfs)
3. [Mutable Addressing (IPNS)](#mutable-addressing-ipns)
4. [Decentralized Naming (ENS)](#decentralized-naming-ens)
5. [Permanent Storage (Arweave)](#permanent-storage-arweave)
6. [Private Gateways](#private-gateways)
7. [Best Practices](#best-practices)
8. [Fallback Strategies](#fallback-strategies)

---

## Why Decentralization Matters

Traditional web infrastructure relies on centralized servers that can:
- Be taken offline by authorities
- Censor content based on jurisdiction
- Experience single points of failure
- Require trust in third parties

**Decentralized infrastructure:**
- ✅ No single point of failure
- ✅ Censorship-resistant by design
- ✅ Content-addressed (immutable)
- ✅ Peer-to-peer distribution
- ✅ Permissionless access

---

## Decentralized Storage (IPFS)

### What is IPFS?

The **InterPlanetary File System (IPFS)** is a peer-to-peer hypermedia protocol designed to make the web faster, safer, and more open. Files are addressed by their cryptographic hash, making them immutable and verifiable.

### Commands

#### Upload Files to IPFS

```bash
# Upload a single file
af ipfs add ./index.html

# Upload a directory
af ipfs add ./dist

# Upload with compression
af ipfs add --compress ./large-file.zip
```

**Output:**
```
✅ File uploaded to IPFS
Hash: QmXxxx...xxxxx
Gateway URL: https://gateway-ipfs.alternatefutures.ai/ipfs/QmXxxx...xxxxx
```

#### Deploy Site to IPFS

```bash
# Deploy current directory
af sites deploy --ipfs

# Deploy specific path
af sites deploy --path ./build --ipfs
```

### How It Works

1. **Content Addressing**: Files are identified by their cryptographic hash (CID)
2. **Distributed Storage**: Content is stored across multiple nodes
3. **Peer-to-Peer**: Files are retrieved from nearest available peers
4. **Immutable**: Same content always has same hash

### Benefits

- **Censorship Resistant**: No central authority controls content
- **Permanent**: Content remains available as long as nodes pin it
- **Verifiable**: Hash proves content integrity
- **Efficient**: Deduplication saves storage and bandwidth

### Configuration

```bash
# Set custom IPFS gateway
export IPFS_GATEWAY_HOSTNAME="your-gateway.example.com"

# Use multiple fallback gateways
export IPFS_GATEWAYS="https://ipfs.io,https://dweb.link,https://gateway.ipfs.io"
```

---

## Mutable Addressing (IPNS)

### What is IPNS?

**InterPlanetary Name System (IPNS)** provides mutable pointers to immutable IPFS content. Update your website without changing the URL.

### Commands

#### Create IPNS Record

```bash
# Create a new IPNS record
af ipns create --name my-website --hash QmXxxx...xxxxx

# Update existing IPNS record
af ipns update --name my-website --hash QmYyyy...yyyyy
```

#### List IPNS Records

```bash
af ipns list
```

#### Delete IPNS Record

```bash
af ipns delete --name my-website
```

### How It Works

1. **Key Pair**: IPNS record tied to cryptographic key pair
2. **Signed Updates**: Only key holder can update record
3. **Resolves to IPFS**: IPNS name points to current IPFS hash
4. **Propagation**: Updates propagate through DHT

### Example Workflow

```bash
# 1. Deploy initial version
af ipfs add ./v1
# Output: QmV1hash...

# 2. Create IPNS record
af ipns create --name my-app --hash QmV1hash...
# Output: IPNS: k51qzi5uqu5...

# 3. Deploy new version
af ipfs add ./v2
# Output: QmV2hash...

# 4. Update IPNS to point to new version
af ipns update --name my-app --hash QmV2hash...
# Users still use same IPNS address, but get v2 content
```

### Benefits

- **Updatable Content**: Change content without changing URL
- **Cryptographically Secure**: Only key holder can update
- **Decentralized**: No central naming authority
- **Works with ENS**: Can link IPNS to human-readable domain

---

## Decentralized Naming (ENS)

### What is ENS?

**Ethereum Name Service (ENS)** provides human-readable names for blockchain addresses and decentralized content. Map `myapp.eth` to IPFS/IPNS content.

### Commands

#### Register ENS Domain

```bash
# Register domain and link to IPNS
af domains register-ens --domain myapp.eth --ipns k51qzi5uqu5...

# Register domain and link to IPFS directly
af domains register-ens --domain myapp.eth --ipfs QmXxxx...xxxxx
```

#### Update ENS Content

```bash
# Update ENS to point to new IPFS hash
af domains update-ens --domain myapp.eth --ipfs QmYyyy...yyyyy
```

### How It Works

1. **Smart Contract**: ENS records stored on Ethereum blockchain
2. **Content Hash**: Domain points to IPFS/IPNS hash
3. **Browser Support**: Modern browsers resolve .eth domains
4. **Censorship Resistant**: No central authority can revoke

### Accessing ENS Domains

Users can access your ENS domain via:
- **ENS-enabled browsers**: Chrome/Firefox with MetaMask
- **Gateways**: `https://myapp.eth.limo`
- **IPFS gateways**: `https://gateway.ipfs.io/ipns/myapp.eth`

### Benefits

- **Human Readable**: `myapp.eth` instead of `QmXxxx...xxxxx`
- **Permanent**: Owned by you, not rented from registrar
- **Blockchain Secured**: Immutable ownership record
- **Multi-purpose**: Can point to wallet, IPFS, website, etc.

---

## Permanent Storage (Arweave)

### What is Arweave?

**Arweave** is a permanent, decentralized storage network. Pay once, store forever.

### Commands

#### Register Domain with Arweave

```bash
# Deploy to Arweave and register domain
af domains register-arns --domain my-permanent-site --path ./dist
```

### How It Works

1. **Endowment Model**: One-time payment for permanent storage
2. **Blockweave**: Novel blockchain structure for scalability
3. **Content Moderation**: Community-driven content policies
4. **Immutable**: Content cannot be changed or deleted

### Benefits

- **Permanent**: Content stored forever (200+ year guarantee)
- **Pay Once**: No recurring fees
- **Immutable**: Perfect for archival and legal records
- **Censorship Resistant**: Distributed across global network

### Use Cases

- Legal documents and contracts
- Historical archives
- NFT metadata
- Scientific research data
- Government transparency records

---

## Private Gateways

### What are Private Gateways?

Private gateways give you **dedicated infrastructure** for accessing IPFS content, with improved performance and reliability.

### Commands

#### Create Private Gateway

```bash
af gateways create --name my-gateway --region us-west
```

#### List Gateways

```bash
af gateways list
```

#### Delete Gateway

```bash
af gateways delete --name my-gateway
```

### Benefits

- **Performance**: Dedicated resources, faster loading
- **Reliability**: SLA-backed uptime guarantees
- **Custom Domain**: Use your own domain name
- **Analytics**: Track usage and performance
- **Rate Limiting**: Control access patterns

### Configuration

```bash
# Use private gateway for uploads
export IPFS_GATEWAY_HOSTNAME="my-gateway.alternatefutures.ai"

# Configure in project
af config set ipfsGateway my-gateway.alternatefutures.ai
```

---

## Best Practices

### 1. **Multi-Gateway Strategy**

Don't rely on a single gateway. Configure fallbacks:

```bash
export IPFS_GATEWAYS="https://my-gateway.alternatefutures.ai,https://ipfs.io,https://dweb.link"
```

### 2. **Pin Important Content**

Ensure content availability by pinning to multiple services:

```bash
# Pin to Alternate Futures
af ipfs add --pin ./critical-content

# Also pin to external pinning service (Pinata, Web3.Storage, etc.)
# This ensures redundancy
```

### 3. **Use IPNS for Updatable Content**

For websites/apps that change frequently:

```bash
# Initial deployment
af ipfs add ./v1 > hash.txt
af ipns create --name myapp --hash $(cat hash.txt)

# Updates
af ipfs add ./v2 > hash.txt
af ipns update --name myapp --hash $(cat hash.txt)
```

### 4. **Combine IPNS + ENS**

Best of both worlds - updatable content with human-readable names:

```bash
# 1. Create IPNS record
af ipns create --name myapp --hash QmXxxx

# 2. Link ENS to IPNS
af domains register-ens --domain myapp.eth --ipns k51qzi5uqu5...

# 3. Update IPNS anytime without changing ENS
af ipns update --name myapp --hash QmYyyy
```

### 5. **Use Subresource Integrity**

For critical resources, verify integrity:

```html
<script
  src="https://gateway.ipfs.io/ipfs/QmXxxx/app.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6..."
  crossorigin="anonymous">
</script>
```

### 6. **Monitor Gateway Health**

Check gateway availability before deployments:

```bash
# Test gateway response
curl -I https://gateway-ipfs.alternatefutures.ai/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG

# Expected: HTTP 200 OK
```

### 7. **Optimize for IPFS**

- **Use Content Hashing**: Leverage browser caching with immutable URLs
- **Split Bundles**: Separate code/assets for better deduplication
- **Compress Assets**: Smaller files = faster retrieval
- **Use DNSLink**: Point DNS records to IPFS for easier access

---

## Fallback Strategies

### Gateway Fallback

Implement client-side gateway fallback:

```javascript
const gateways = [
  'https://my-gateway.alternatefutures.ai',
  'https://ipfs.io',
  'https://dweb.link',
  'https://cloudflare-ipfs.com'
];

async function fetchFromIPFS(hash) {
  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}/ipfs/${hash}`);
      if (response.ok) return response;
    } catch (error) {
      continue; // Try next gateway
    }
  }
  throw new Error('All gateways failed');
}
```

### DNS Fallback

Use multiple DNS providers:

```
# Cloudflare
1.1.1.1

# Google
8.8.8.8

# Quad9
9.9.9.9
```

### Service Worker Caching

Implement aggressive caching for offline access:

```javascript
// Service worker caches IPFS content
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

---

## Architecture Patterns

### Static Site (Full Decentralization)

```
User Browser
    ↓
ENS (myapp.eth)
    ↓
IPNS (k51qzi5...)
    ↓
IPFS (QmXxxx...)
    ↓
Distributed Nodes
```

**Advantages:**
- Fully decentralized
- Censorship resistant
- No server costs
- Globally distributed

**Trade-offs:**
- Static content only
- Initial load may be slower
- No server-side logic

### Hybrid Architecture

```
User Browser
    ↓
ENS → IPFS (Static Assets)
    ↓
API Gateway (Lambda Functions)
    ↓
Decentralized Database (OrbitDB, Ceramic)
```

**Advantages:**
- Dynamic functionality
- Better performance
- Progressive decentralization

---

## Monitoring & Debugging

### Check IPFS Content

```bash
# Verify content is available
curl https://ipfs.io/ipfs/QmXxxx...xxxxx

# Check via multiple gateways
for gateway in ipfs.io dweb.link cloudflare-ipfs.com; do
  echo "Testing $gateway..."
  curl -I https://$gateway/ipfs/QmXxxx...xxxxx
done
```

### Verify IPNS Resolution

```bash
# Check IPNS record
af ipns list --name myapp

# Test resolution via gateway
curl https://ipfs.io/ipns/k51qzi5uqu5...
```

### Monitor Gateway Performance

```bash
# Simple uptime check
#!/bin/bash
HASH="QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
GATEWAY="https://gateway-ipfs.alternatefutures.ai"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY/ipfs/$HASH")
if [ $RESPONSE -eq 200 ]; then
  echo "✅ Gateway healthy"
else
  echo "❌ Gateway down (HTTP $RESPONSE)"
fi
```

---

## Resources

### Official Documentation
- [IPFS Documentation](https://docs.ipfs.io/)
- [IPNS Specification](https://docs.ipfs.io/concepts/ipns/)
- [ENS Documentation](https://docs.ens.domains/)
- [Arweave Documentation](https://www.arweave.org/build)

### Tools & Services
- [IPFS Desktop](https://github.com/ipfs/ipfs-desktop) - Local IPFS node
- [Pinata](https://pinata.cloud/) - IPFS pinning service
- [Web3.Storage](https://web3.storage/) - Free IPFS storage
- [Fleek](https://fleek.co/) - Deploy to IPFS/IPNS

### Community
- [IPFS Forums](https://discuss.ipfs.io/)
- [ENS Discord](https://chat.ens.domains/)
- [Alternate Futures Discord](https://discord.gg/alternatefutures)

---

## FAQ

### Q: What happens if IPFS nodes go offline?

Content remains available as long as **at least one node** has it pinned. Use pinning services for redundancy.

### Q: How long does IPNS take to propagate?

IPNS updates typically propagate within **1-5 minutes**, but can take up to 30 minutes for full global propagation.

### Q: Can I use a custom domain with IPFS?

Yes! Use **DNSLink** to point your domain to IPFS content:

```
_dnslink.yourdomain.com. IN TXT "dnslink=/ipfs/QmXxxx...xxxxx"
```

### Q: Is IPFS content truly permanent?

IPFS content is permanent **as long as it's pinned**. For guaranteed permanence, use **Arweave**.

### Q: How much does it cost?

- **IPFS**: Free (you pay for pinning services if needed)
- **IPNS**: Free (included with Alternate Futures)
- **ENS**: ~$5-10/year + gas fees
- **Arweave**: One-time fee (~$0.01-0.10 per MB)

---

## Contributing

Help improve decentralization features:

1. Test gateway reliability
2. Report connectivity issues
3. Suggest fallback strategies
4. Contribute to documentation

Open issues at: https://github.com/alternatefutures/package-cloud-cli/issues

---

**Build the uncensorable web. Deploy with confidence.**
