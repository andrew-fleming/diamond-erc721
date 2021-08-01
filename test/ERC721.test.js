/* global describe it before ethers */

const {
    getSelectors,
    FacetCutAction
  } = require('../scripts/libraries/diamond.js')
  
  const { deployDiamond } = require('../scripts/deployDiamond.ts')
  
  const { expect } = require('chai')
  
  describe('ERC721 Test', async function () {
    let diamondAddress
    let diamondCutFacet
    let tx
    let receipt
    const addresses = []

    let owner
    let alice
    let bob
    let token

    let tokenURI = "www.token"
  
    before(async function () {
        [owner, alice, bob] = await ethers.getSigners();
        diamondAddress = await deployDiamond()
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
        diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
        ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)

        const NFTFactoryFacet = await ethers.getContractFactory('NFTFactoryFacet')
        nftFactory = await NFTFactoryFacet.deploy()
        await nftFactory.deployed()
        addresses.push(nftFactory.address)
        selectors = getSelectors(nftFactory)
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: nftFactory.address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }

        token = await ethers.getContractAt("ERC721Facet", diamondAddress);
        nftFactory = await ethers.getContractAt("NFTFactoryFacet", diamondAddress);
    })

    describe("NFT", async() => {
        it("should init", async() => {
            expect(token).to.be.ok
            expect(nftFactory).to.be.ok
        })

        it("should mint", async() => {
            await nftFactory.mintItem(owner.address, tokenURI);
        })

        it("should track tokenId mint", async() => {
            expect(await nftFactory.totalSupply())
                .to.eq(1)
        })
    })

    describe("Transfer", async() => {
        it("Should track transfer", async() => {
            await nftFactory.transfer(alice.address, 1)
            expect(await token.balanceOf(alice.address))
                .to.eq(1)

            expect(await token.balanceOf(owner.address))
                .to.eq(0)
        })

        it("should show tokenIds", async() => {
            await nftFactory.mintItem(alice.address, tokenURI)
            expect(await token.balanceOf(alice.address))
                .to.eq(2)
             
        })
    })

    describe("Enumeration", async() => {
        before(async() => {
            await Promise.all([
                nftFactory.mintItem(owner.address, tokenURI),
                nftFactory.mintItem(owner.address, tokenURI),
                nftFactory.mintItem(owner.address, tokenURI),
            ])
        })
        
        it("should track tokenOfOwnerByIndex", async() => {
            expect(await nftFactory.tokenOfOwnerByIndex(owner.address, 0))
                .to.eq(3)
            expect(await nftFactory.tokenOfOwnerByIndex(owner.address, 1))
                .to.eq(4)
        })

        it("should track tokenByIndex", async() => {
            expect(await nftFactory.tokenByIndex(0))
                .to.eq(1)
            expect(await nftFactory.tokenByIndex(1))
                .to.eq(2)
        })
        
    })

})