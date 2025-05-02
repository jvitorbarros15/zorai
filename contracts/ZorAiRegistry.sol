// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ZorAiRegistry {
    // Risk levels
    enum RiskLevel { LOW, MEDIUM, HIGH }
    
    // Struct to store image metadata
    struct ImageData {
        string ipfsHash;      // IPFS CID of the image metadata
        string modelUsed;     // AI model used (e.g., DALL-E)
        address creator;      // Address that registered the image
        uint256 timestamp;    // When the image was registered
        bool isVerified;      // Verification status
        RiskLevel riskLevel;  // Risk level assessment
        string[] riskReasons; // Reasons for risk assessment
    }

    // Mapping from imageId to ImageData
    mapping(string => ImageData) public images;
    
    // Array to keep track of all registered imageIds
    string[] public registeredImages;
    
    // Array to keep track of high-risk images
    string[] public highRiskImages;
    
    // Events
    event ImageRegistered(
        string indexed imageId,
        string ipfsHash,
        string modelUsed,
        address creator,
        uint256 timestamp,
        RiskLevel riskLevel
    );
    
    event ImageVerified(
        string indexed imageId,
        bool isVerified,
        RiskLevel riskLevel
    );

    // Register a new image
    function registerImage(
        string memory imageId,
        string memory modelUsed,
        string memory ipfsHash,
        RiskLevel riskLevel,
        string[] memory riskReasons
    ) public {
        require(bytes(imageId).length > 0, "Image ID cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(modelUsed).length > 0, "Model used cannot be empty");
        require(images[imageId].creator == address(0), "Image already registered");

        // Create new image data
        ImageData memory newImage = ImageData({
            ipfsHash: ipfsHash,
            modelUsed: modelUsed,
            creator: msg.sender,
            timestamp: block.timestamp,
            isVerified: false,
            riskLevel: riskLevel,
            riskReasons: riskReasons
        });

        // Store the image data
        images[imageId] = newImage;
        registeredImages.push(imageId);

        // If high risk, add to high-risk images array
        if (riskLevel == RiskLevel.HIGH) {
            highRiskImages.push(imageId);
        }

        // Emit event
        emit ImageRegistered(
            imageId,
            ipfsHash,
            modelUsed,
            msg.sender,
            block.timestamp,
            riskLevel
        );
    }

    // Get image data by ID
    function getImageData(string memory imageId) public view returns (
        string memory ipfsHash,
        string memory modelUsed,
        address creator,
        uint256 timestamp,
        bool isVerified,
        RiskLevel riskLevel,
        string[] memory riskReasons
    ) {
        ImageData memory data = images[imageId];
        require(data.creator != address(0), "Image not found");
        
        return (
            data.ipfsHash,
            data.modelUsed,
            data.creator,
            data.timestamp,
            data.isVerified,
            data.riskLevel,
            data.riskReasons
        );
    }

    // Update verification status and risk level
    function updateVerification(
        string memory imageId,
        bool isVerified,
        RiskLevel riskLevel,
        string[] memory riskReasons
    ) public {
        require(bytes(imageId).length > 0, "Image ID cannot be empty");
        require(images[imageId].creator != address(0), "Image not found");

        ImageData storage data = images[imageId];
        data.isVerified = isVerified;
        data.riskLevel = riskLevel;
        data.riskReasons = riskReasons;

        // Update high-risk images array
        if (riskLevel == RiskLevel.HIGH) {
            // Check if already in high-risk array
            bool isHighRisk = false;
            for (uint i = 0; i < highRiskImages.length; i++) {
                if (keccak256(bytes(highRiskImages[i])) == keccak256(bytes(imageId))) {
                    isHighRisk = true;
                    break;
                }
            }
            if (!isHighRisk) {
                highRiskImages.push(imageId);
            }
        }

        emit ImageVerified(imageId, isVerified, riskLevel);
    }

    // Get total number of registered images
    function getTotalImages() public view returns (uint256) {
        return registeredImages.length;
    }

    // Get total number of high-risk images
    function getTotalHighRiskImages() public view returns (uint256) {
        return highRiskImages.length;
    }

    // Get all high-risk images
    function getHighRiskImages() public view returns (string[] memory) {
        return highRiskImages;
    }

    // Check if an image is registered
    function isImageRegistered(string memory imageId) public view returns (bool) {
        return images[imageId].creator != address(0);
    }

    // Check if an image is high risk
    function isHighRisk(string memory imageId) public view returns (bool) {
        return images[imageId].riskLevel == RiskLevel.HIGH;
    }
} 