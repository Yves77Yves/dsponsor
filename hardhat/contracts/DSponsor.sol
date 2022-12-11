// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../node_modules/@openzeppelin/contracts/access/AccessControl.sol";

import "../node_modules/@openzeppelin/contracts/interfaces/IERC721.sol";

import "./lib/ContextMixin.sol";

import "./interfaces/IDSponsor.sol";

/**
 * @title A sponsoring contract
 * @author Anthony Gourraud
 * @author Yves Spielmann
 * @notice Give for each token of an ERC721 contract a right to advertise.
 *  Token owners are considered as "sponsors" and can provide sponsoring information
 *  for properties specified by sponsee, regarding an off-chain promotion purpose
 * ("link" and "logo" keys to add at the end of a newsletter, "audioAd" towards a pre-roll on podcasts for example)
 *
 * Sponsee can :
 * - allow or disallow any string as sponsoring property
 * - validates data (or not) sponsors submit
 * - grant or revoke any other address with sponsee powers
 * (SET_PROPERTIES_ROLE and VALIDATE_ROLE via {AccessControl})
 *
 * Sponsors, as token owners, can :
 * - submit data related to an allowed property for tokens they own
 * (string data can be "https://mywebsite.com" for "link" property, set to tokenId "1" for example)
 * - transfer a token to another address, new owner will be the only one able to set sponsoring data
 */
contract DSponsor is AccessControl, ContextMixin, IDSponsor {
    struct SponsoData {
        string lastDataValidated;
        string lastDataSubmitted;
        string lastRejectionReason;
    }

    bytes32 public constant SET_PROPERTIES_ROLE =
        keccak256("SET_PROPERTIES_ROLE");
    bytes32 public constant SET_PERIOD_ROLE = keccak256("SET_PERIOD_ROLE");
    bytes32 public constant VALIDATE_ROLE = keccak256("VALIDATE_ROLE");

    /** @notice Sponsoring conditions, expected to be an immutable document
     * stored on IPFS or Arweave (but it's not required)
     */
    string public RULES_URI;

    /** @notice Sponsoring start date and end date
     */
    uint256 public startPeriod;
    uint256 public endPeriod;

    IERC721 public immutable NFT_CONTRACT;

    /*
     * For sponsoring allowed property, use bytes32 from string input
     * See {_propertyStringToBytes32}
     */
    mapping(bytes32 => bool) private _allowedProperties;

    // tokenId => bytes32StringProperty => stringDatas
    mapping(uint256 => mapping(bytes32 => SponsoData)) private _sponsoDatas;

    /* ****************
     *  ERRORS
     *****************/
    error isNotERC721Contract();

    /* ****************
     *  MODIFIERS
     *****************/

    modifier onlyAllowedProperty(bytes32 property) {
        if (!_isAllowedProperty(property)) revert UnallowedProperty();
        _;
    }

    modifier onlySponsor(uint256 tokenId) {
        if (_msgSender() != NFT_CONTRACT.ownerOf(tokenId))
            revert UnallowedSponsorOperation();
        _;
    }

    /* ****************
     *  CONTRACT CONSTRUCTOR
     *****************/

    /**
     * @param ERC721Contract ERC721 compliant address
     * @param rulesURI Document with sponsoring conditions. IPFS or Arweave links might be more approriate
     * @param sponsee Controller who gives sponsoring opportunity
     */
    constructor(
        IERC721 ERC721Contract,
        string memory rulesURI,
        address sponsee
    ) {
        if (sponsee == address(0)) revert SponseeCannotBeZeroAddress();

        try ERC721Contract.supportsInterface(0x80ac58cd) returns (
            bool
        ) {} catch (bytes memory) {
            revert isNotERC721Contract();
        }

        NFT_CONTRACT = IERC721(ERC721Contract);
        RULES_URI = rulesURI;

        _setupRole(DEFAULT_ADMIN_ROLE, sponsee);
        _setupRole(SET_PROPERTIES_ROLE, sponsee);
        _setupRole(SET_PERIOD_ROLE, sponsee);
        _setupRole(VALIDATE_ROLE, sponsee);
    }

    /* ****************
     *  EXTERNAL FUNCTIONS
     *****************/

    /**
     * @notice Enable or disable a specific sponsoring key
     * @param propertyString - Can be any string, according off-chain sponsee promotion purpose
     * @param allowed - Set `false` to disable `propertyString` usage
     *
     * Emits {PropertyUpdate} event
     */
    function setProperty(string memory propertyString, bool allowed)
        external
        onlyRole(SET_PROPERTIES_ROLE)
    {
        _setProperty(propertyString, allowed);
    }

    /**
     * @notice Sponsoring data submission
     * @param tokenId - Concerned token
     * @param property - Concerned property
     * @param data - Can be any string
     *
     * Emits {NewSponsoData} event
     */
    function setSponsoData(
        uint256 tokenId,
        string memory property,
        string memory data
    ) external onlySponsor(tokenId) {
        _setSponsoData(tokenId, _propertyStringToBytes32(property), data);
        emit NewSponsoData(tokenId, property, data);
    }

    /**
     * @notice Validate (or not) data submitted by sponsor. If rejected, inform a reason.
     * @param tokenId - Concerned token
     * @param property - Concerned property
     * @param validated - If `true`, submitted data is validated, previous data replaced for given tokenId and property
     * @param reason Explain why it gets rejected (optionnal)
     *
     * Emits {NewSponsoDataValidation} event
     */
    function setSponsoDataValidation(
        uint256 tokenId,
        string memory property,
        bool validated,
        string memory reason
    ) external onlyRole(VALIDATE_ROLE) {
        string memory data;
        data = _setSponsoDataValidation(
            tokenId,
            _propertyStringToBytes32(property),
            validated,
            reason
        );

        emit NewSponsoDataValidation(
            tokenId,
            property,
            validated,
            data,
            reason
        );
    }

    /**
     * @notice Set a validity period
     * @param start - concerned start period
     * @param end - concerned end period. end Period must be greater than start Period.
     *
     * Emits {ValidityPeriodUpdate} event
     */
    function setValidityPeriod(uint256 start, uint256 end)
        external
        onlyRole(SET_PERIOD_ROLE)
    {
        _setValidityPeriod(start, end);
    }

    /* ****************
     *  EXTERNAL GETTERS
     *****************/

    function getAccessContract() external view returns (address) {
        return address(NFT_CONTRACT);
    }

    function getStartPeriod() external view returns (uint256) {
        return startPeriod;
    }

    function getEndPeriod() external view returns (uint256) {
        return endPeriod;
    }

    function getSponsoData(uint256 tokenId, string memory propertyString)
        external
        view
        returns (
            string memory lastDataValidated,
            string memory lastDataSubmitted,
            string memory lastRejectionReason
        )
    {
        SponsoData storage sponsoData = _sponsoDatas[tokenId][
            _propertyStringToBytes32(propertyString)
        ];

        lastDataValidated = sponsoData.lastDataValidated;
        lastDataSubmitted = sponsoData.lastDataSubmitted;
        lastRejectionReason = sponsoData.lastRejectionReason;
    }

    function isAllowedProperty(string memory propertyString)
        external
        view
        returns (bool)
    {
        return _isAllowedProperty(_propertyStringToBytes32(propertyString));
    }

    /* ****************
     *  INTERNAL OVERRIDE FUNCTIONS
     *****************/

    /* @dev Used instead of msg.sender as transactions won't be sent
     * by the original token owner, but by relayer.
     */
    function _msgSender() internal view override returns (address sender) {
        return ContextMixin.msgSender();
    }

    /* ****************
     *  PRIVATE DATA HANDLERS
     *****************/

    function _setProperty(bytes32 propertyBytes, bool allowed) private {
        _allowedProperties[propertyBytes] = allowed;
    }

    function _setProperty(string memory propertyString, bool allowed) private {
        if (bytes(propertyString).length > 0) {
            _setProperty(_propertyStringToBytes32(propertyString), allowed);
            emit PropertyUpdate(propertyString, allowed);
        }
    }

    function _setValidityPeriod(uint256 start, uint256 end) private {
        startPeriod = start;
        endPeriod = end;
        emit ValidityPeriodUpdate(start, end);
    }

    function _setSponsoData(
        uint256 tokenId,
        bytes32 property,
        string memory data
    ) private onlyAllowedProperty(property) {
        string memory lastDataValidated = _sponsoDatas[tokenId][property]
            .lastDataValidated;
        _sponsoDatas[tokenId][property] = SponsoData(
            lastDataValidated,
            data,
            ""
        );
    }

    function _setSponsoDataValidation(
        uint256 tokenId,
        bytes32 property,
        bool validated,
        string memory reason
    ) private onlyAllowedProperty(property) returns (string memory) {
        string memory data = _sponsoDatas[tokenId][property].lastDataSubmitted;

        if (bytes(data).length == 0) revert NoDataSubmitted();
        if (validated) {
            _sponsoDatas[tokenId][property] = SponsoData(data, "", "");
        } else {
            _sponsoDatas[tokenId][property].lastRejectionReason = reason;
        }
        return data;
    }

    /* ****************
     *  PRIVATE GETTERS
     *****************/

    function _isAllowedProperty(bytes32 propertyBytes)
        private
        view
        returns (bool)
    {
        return _allowedProperties[propertyBytes];
    }

    function _propertyStringToBytes32(string memory p)
        private
        pure
        returns (bytes32)
    {
        return keccak256(bytes(p));
    }
}
