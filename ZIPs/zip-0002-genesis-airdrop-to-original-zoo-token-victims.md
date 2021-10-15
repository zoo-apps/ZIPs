---
zip: 0002
title: Genesis Airdrop to Original ZOO Token Victims
author: Zoo Team
type: Standards Track
category: Core
status: Final
originated: 2021-10
traces-from: "Whitepaper section 15 (Gen 0 NFT Drop)"
created: 2024-12-20
---

# ZIP-2: Genesis Airdrop to Original ZOO Token Victims

## Abstract

This proposal defines the 100% genesis airdrop of new ZOO tokens to victims of the Logan Paul ZOO token that collapsed in October 2021. All holders of the original ZOO token at the time of its collapse receive a proportional share of the new ZOO token supply, representing a full restoration of their holdings in the new ecosystem.

## Motivation

The original ZOO token launched by Logan Paul in 2021 resulted in significant losses for investors when the project was abandoned. Key facts:

1. **Original Launch**: ZOO token launched as part of CryptoZoo game ecosystem
2. **Collapse**: Project abandoned October 2021, token value went to near-zero
3. **Victims**: Thousands of holders lost investments ranging from hundreds to millions
4. **No Remediation**: Original team provided no compensation or recovery mechanism
5. **Community Impact**: Damaged trust in crypto gaming and NFT projects

The new Zoo ecosystem seeks to restore faith and provide restitution through a complete airdrop to original victims.

## Specification

### Airdrop Parameters

```yaml
Total Supply Allocated: 10,000,000,000 ZOO (100% of genesis)
Snapshot Date: October 31, 2021 23:59:59 UTC
Eligible Holders: All addresses holding original ZOO tokens at snapshot
Distribution Method: Proportional to holdings at snapshot
Claiming Period: Perpetual (no expiry)
Vesting: None - fully liquid immediately
```

### Eligibility Calculation

```python
class GenesisAirdrop:
    def __init__(self):
        self.snapshot_block = 13528900  # Ethereum mainnet
        self.original_supply = 2_000_000_000_000_000  # Original ZOO supply
        self.new_supply = 10_000_000_000  # New ZOO supply
        
    def calculate_allocation(self, address: str) -> int:
        """
        Calculate new ZOO allocation for original holder
        """
        # Get balance at snapshot block
        original_balance = get_balance_at_block(
            address, 
            self.snapshot_block,
            original_zoo_contract
        )
        
        # Calculate proportional share
        proportion = original_balance / self.original_supply
        new_allocation = int(proportion * self.new_supply)
        
        return new_allocation
```

### Victim Categories

| Category | Original Holdings | Est. Holders | New ZOO Allocation |
|----------|------------------|--------------|-------------------|
| Whales | > 1T original | ~50 | > 5M new ZOO |
| Large | 100B - 1T | ~500 | 500K - 5M new ZOO |
| Medium | 10B - 100B | ~2,000 | 50K - 500K new ZOO |
| Small | 1B - 10B | ~5,000 | 5K - 50K new ZOO |
| Micro | < 1B | ~10,000 | < 5K new ZOO |

### Smart Contract Implementation

```solidity
contract ZooGenesisAirdrop {
    mapping(address => uint256) public allocations;
    mapping(address => bool) public claimed;
    
    bytes32 public merkleRoot;
    uint256 public totalAllocated;
    uint256 public totalClaimed;
    
    event AirdropClaimed(address indexed victim, uint256 amount);
    
    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
        totalAllocated = 10_000_000_000 * 10**18; // 10B ZOO
    }
    
    function claim(
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        require(!claimed[msg.sender], "Already claimed");
        
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
        
        claimed[msg.sender] = true;
        totalClaimed += amount;
        
        // Transfer new ZOO tokens
        ZOO.transfer(msg.sender, amount);
        
        emit AirdropClaimed(msg.sender, amount);
    }
    
    function checkAllocation(address victim) external view returns (uint256) {
        return allocations[victim];
    }
}
```

### Claiming Process

1. **Verification**: Victims verify their address was holding original ZOO at snapshot
2. **Proof Generation**: Use claiming dApp to generate merkle proof
3. **Claim Execution**: Submit transaction with proof to claim new ZOO
4. **No Time Limit**: Claims remain open indefinitely for victim protection

### Unclaimed Token Handling

```yaml
Years 0-2: Tokens remain in airdrop contract
Year 3+: Unclaimed tokens can be allocated to:
  - Victim compensation fund (50%)
  - Ecosystem development (30%)
  - Future victim airdrops (20%)
  
Governance Required: veZOO vote with 75% quorum to reallocate
```

## Victim Support Infrastructure

### Recovery Portal (zoo.fund/recovery)

```typescript
interface RecoveryPortal {
  // Check eligibility
  checkEligibility(address: string): {
    isEligible: boolean;
    originalBalance: BigNumber;
    newAllocation: BigNumber;
    usdValueLost: number;
  }
  
  // Generate claim
  generateClaim(address: string): {
    proof: string[];
    amount: BigNumber;
    instructions: ClaimInstructions;
  }
  
  // Support resources
  getSupport(): {
    documentation: URL;
    videoTutorial: URL;
    liveChat: ChatWidget;
    communityForum: URL;
  }
}
```

### Victim DAO

Special governance structure for original victims:

```solidity
contract VictimDAO {
    // Only original victims can participate
    modifier onlyVictim() {
        require(airdrop.allocations(msg.sender) > 0, "Not a victim");
        _;
    }
    
    // Enhanced voting power for victims
    function getVotingPower(address voter) public view returns (uint256) {
        uint256 basePower = ZOO.balanceOf(voter);
        
        if (isVictim(voter)) {
            // 2x voting power for victims in first 2 years
            if (block.timestamp < launchTime + 2 years) {
                basePower = basePower * 2;
            }
        }
        
        return basePower;
    }
}
```

## Historical Documentation

### Timeline of Original Collapse

```yaml
2021-07-01: CryptoZoo announced by Logan Paul
2021-08-15: ZOO token launched on Ethereum
2021-09-01: Peak price ~$0.00000007
2021-10-15: Development stops, team goes silent
2021-10-31: Effective abandonment, price < $0.00000001
2021-11-15: Community realizes project is dead
2022-2023: Multiple failed revival attempts
2024: New Zoo team forms for victim recovery
```

### Evidence Preservation

All evidence of original holdings preserved on-chain:
- Ethereum transaction history
- Original contract: `0x09e0df4ae51111ca27d6b85708cfb3f1f7cae982`
- Snapshot merkle tree published to IPFS
- Victim testimonials archived

## Legal Considerations

### Not Securities
- Airdrop is restitution, not investment
- No purchase required
- No expectation of profit from efforts of others
- Pure victim compensation mechanism

### Tax Treatment
- Airdrop may be taxable income at FMV when claimed
- Victims should consult tax advisors
- Zoo Foundation will provide Form 1099-MISC if required

### No Admission of Liability
- New Zoo team not affiliated with Logan Paul
- Airdrop is voluntary community restitution
- No legal obligation, purely restorative

## Implementation Timeline

### Phase 1: Snapshot & Verification (Complete)
- Original holder snapshot taken
- Merkle tree generated
- Allocations calculated

### Phase 2: Contract Deployment (Q1 2025)
- Deploy airdrop contract
- Publish merkle root
- Open claiming portal

### Phase 3: Claiming Period (Q1 2025 - Perpetual)
- Victims claim allocations
- Support provided via Discord/Telegram
- Regular updates on claim progress

### Phase 4: Community Building (Ongoing)
- Victim DAO formation
- Recovery initiatives
- Ecosystem development

## Success Metrics

```yaml
Target Metrics:
  - Claim Rate: > 60% of victims within Year 1
  - Value Recovery: ZOO price exceeds original ATH
  - Victim Satisfaction: > 80% positive sentiment
  - Ecosystem Growth: 100K+ active users
  - Trust Restoration: Positive media coverage
```

## Reference Implementation

**Repository**: [zooai/genesis-airdrop](https://github.com/zooai/genesis-airdrop)

**Key Files**:
- `/contracts/ZooGenesisAirdrop.sol` - Main airdrop contract with merkle proof verification
- `/contracts/VictimDAO.sol` - Enhanced governance for original victims
- `/scripts/snapshot.py` - Ethereum snapshot generation at block 13528900
- `/scripts/merkle_tree.py` - Merkle tree construction from snapshot data
- `/web/recovery-portal/` - Web interface for claim verification and execution
- `/api/eligibility.ts` - API for checking victim eligibility and allocations
- `/data/snapshot.json` - Original holder snapshot data
- `/data/merkle_root.txt` - Published merkle root for verification
- `/tests/airdrop_test.sol` - Smart contract test suite
- `/docs/claiming_guide.md` - Step-by-step claiming instructions

**Status**: Implemented (Q1 2025 Deployment)

**Live Services**:
- Recovery Portal: `https://zoo.fund/recovery`
- Eligibility Checker: `https://api.zoo.fund/v1/airdrop/check/{address}`
- Claim History: `https://api.zoo.fund/v1/airdrop/claims`

## References

1. [Original CryptoZoo Announcement](https://twitter.com/LoganPaul/status/...)
2. [Coffeezilla Investigation](https://youtube.com/...)
3. [Ethereum Snapshot Block 13528900](https://etherscan.io/block/13528900)
4. [Original ZOO Contract](https://etherscan.io/address/0x09e0df4ae51111ca27d6b85708cfb3f1f7cae982)
5. [Victim Testimonials](https://ipfs.io/ipfs/...)

## Conclusion

The genesis airdrop represents unprecedented restitution in crypto history - a complete restoration of value to victims of an abandoned project. By allocating 100% of genesis supply to original holders, Zoo demonstrates commitment to righting past wrongs and building a sustainable, community-owned ecosystem.

This is not just token distribution - it's restorative justice for the crypto community.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).