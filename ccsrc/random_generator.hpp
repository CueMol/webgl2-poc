#pragma once
#include <stdlib.h>

namespace demo {

template <class Dest, class Source>
inline Dest bit_cast(Source const& source)
{
    static_assert(sizeof(Dest) == sizeof(Source), "source and dest must be same size");
    Dest dest;
    memcpy(&dest, &source, sizeof(dest));
    return dest;
}

inline uint32_t _rd()
{
    return rand();
}

class RandomGenerator
{
    /// random seeds
    uint64_t s[2]; // = {1234567890, 987654321};

public:
    RandomGenerator(int seed)
    {
        s[0] = (uint64_t(_rd()) << 32) ^ (_rd());
        s[1] = (uint64_t(_rd()) << 32) ^ (_rd());
    }

    uint64_t xorshift128plus(void)
    {
        uint64_t x = s[0];
        uint64_t const y = s[1];
        s[0] = y;
        x ^= x << 23;                          // a
        s[1] = x ^ y ^ (x >> 17) ^ (y >> 26);  // b, c
        return s[1] + y;
    }

    inline double randomUniform()
    {
        uint64_t v = xorshift128plus();

        static const uint64_t kExponentBits = 0x3FF0000000000000UL;
        static const uint64_t kMantissaMask = 0x000FFFFFFFFFFFFFUL;
        uint64_t random = (v & kMantissaMask) | kExponentBits;
        return (bit_cast<double>(random) - 1) - 0.5;
    }
};

}  // namespace demo
