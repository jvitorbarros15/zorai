// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ImageRegistry
 * @dev Smart contract for registering and verifying AI-generated image IDs
 */
contract ImageRegistry {
    // Struct to store image data
    struct ImageData {
        string imageId;
        string modelUsed;
        string ipfsHash;
        address creator;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from image ID to image data
    mapping(string => ImageData) private images;
    
    // Array to store all image IDs
    string[] private allImageIds;

    // Events
    event ImageRegistered(
        string indexed imageId,
        string modelUsed,
        string ipfsHash,
        address indexed creator,
        uint256 timestamp
    );

    /**
     * @dev Register a new AI-generated image
     * @param imageId The unique ID of the image (SHA256 hash)
     * @param modelUsed The AI model used to generate the image
     * @param ipfsHash The IPFS hash of the image metadata
     */
    function registerImage(
        string memory imageId,
        string memory modelUsed,
        string memory ipfsHash
    ) public {
        // Check if image ID already exists
        require(!images[imageId].exists, "Image ID already registered");
        
        // Create new image data
        ImageData memory newImage = ImageData({
            imageId: imageId,
            modelUsed: modelUsed,
            ipfsHash: ipfsHash,
            creator: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        // Store image data
        images[imageId] = newImage;
        allImageIds.push(imageId);

        // Emit event
        emit ImageRegistered(
            imageId,
            modelUsed,
            ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Get data for a specific image ID
     * @param imageId The ID of the image to query
     * @return creator The address that registered the image
     * @return modelUsed The AI model used
     * @return ipfsHash The IPFS hash of the metadata
     * @return timestamp When the image was registered
     */
    function getImageData(string memory imageId)
        public
        view
        returns (
            address creator,
            string memory modelUsed,
            string memory ipfsHash,
            uint256 timestamp
        )
    {
        require(images[imageId].exists, "Image ID not found");
        
        ImageData memory image = images[imageId];
        return (
            image.creator,
            image.modelUsed,
            image.ipfsHash,
            image.timestamp
        );
    }

    /**
     * @dev Get all registered image IDs
     * @return Array of all image IDs
     */
    function getAllImageIds() public view returns (string[] memory) {
        return allImageIds;
    }

    /**
     * @dev Check if an image ID exists
     * @param imageId The ID to check
     * @return bool Whether the image ID exists
     */
    function imageExists(string memory imageId) public view returns (bool) {
        return images[imageId].exists;
    }
} 