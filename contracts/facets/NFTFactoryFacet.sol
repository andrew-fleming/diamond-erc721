// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC721Facet.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import { NFT } from "../libraries/LibAppStorage.sol";

contract NFTFactoryFacet is ERC721Facet {

    function mintItem(address to) external {
        LibDiamond.enforceIsContractOwner();
        uint256 nftNum = s.totalSupply += 1;
        _safeMint(to, nftNum);
    }

    function transfer(address to, uint256 tokenId) external {
        _transfer(msg.sender, to, tokenId);
    }

    function totalSupply() external view returns(uint256) {
        return s.totalSupply;
    } 
}